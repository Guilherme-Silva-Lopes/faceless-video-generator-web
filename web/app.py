"""
Faceless Video Generator - Web Interface
FastAPI backend for managing the video generation system
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os
from datetime import datetime

# Configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://adkjkixcisfjogkrkupg.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
KESTRA_URL = os.getenv("KESTRA_URL", "https://kestra.tribeai.com.br")
KESTRA_NAMESPACE = os.getenv("KESTRA_NAMESPACE", "company.team")

app = FastAPI(
    title="Faceless Video Generator",
    description="Web interface for managing automated faceless video generation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Channel(BaseModel):
    channel_id: str
    channel_name: str
    language: str = "pt-BR"
    niche: Optional[str] = None
    is_active: bool = True
    viral_threshold_views: int = 7000
    viral_threshold_hours: int = 48

class ChannelUpdate(BaseModel):
    channel_name: Optional[str] = None
    language: Optional[str] = None
    niche: Optional[str] = None
    is_active: Optional[bool] = None
    viral_threshold_views: Optional[int] = None
    viral_threshold_hours: Optional[int] = None

class ManualVideoRequest(BaseModel):
    video_url: str
    language: str = "pt-BR"

class SettingUpdate(BaseModel):
    value: str

# Helper function for Supabase requests
async def supabase_request(method: str, endpoint: str, data: dict = None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    async with httpx.AsyncClient() as client:
        url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
        
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json() if response.text else None

# ============================================
# CHANNELS ENDPOINTS
# ============================================

@app.get("/api/channels")
async def list_channels():
    """Get all channels"""
    return await supabase_request("GET", "channels?select=*&order=created_at.desc")

@app.post("/api/channels")
async def create_channel(channel: Channel):
    """Create a new channel to monitor"""
    return await supabase_request("POST", "channels", channel.dict())

@app.patch("/api/channels/{channel_id}")
async def update_channel(channel_id: str, update: ChannelUpdate):
    """Update a channel"""
    data = {k: v for k, v in update.dict().items() if v is not None}
    result = await supabase_request("PATCH", f"channels?id=eq.{channel_id}", data)
    return result[0] if result else None

@app.delete("/api/channels/{channel_id}")
async def delete_channel(channel_id: str):
    """Delete a channel"""
    await supabase_request("DELETE", f"channels?id=eq.{channel_id}")
    return {"status": "deleted"}

# ============================================
# PROJECTS ENDPOINTS
# ============================================

@app.get("/api/projects")
async def list_projects(status: Optional[str] = None, limit: int = 50):
    """Get all projects with optional status filter"""
    endpoint = f"projects?select=*,channels(channel_name)&order=created_at.desc&limit={limit}"
    if status:
        endpoint += f"&status=eq.{status}"
    return await supabase_request("GET", endpoint)

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get a specific project with all details"""
    result = await supabase_request("GET", f"projects?id=eq.{project_id}&select=*,channels(*)")
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result[0]

@app.post("/api/projects/manual")
async def create_manual_project(request: ManualVideoRequest, background_tasks: BackgroundTasks):
    """Manually create a project from a video URL"""
    from slugify import slugify
    import re
    
    # Extract video title from URL (basic implementation)
    video_id = None
    patterns = [r'(?:v=|/v/|youtu\.be/|/embed/)([a-zA-Z0-9_-]{11})']
    for pattern in patterns:
        match = re.search(pattern, request.video_url)
        if match:
            video_id = match.group(1)
            break
    
    project_name = f"Manual Video {datetime.now().strftime('%Y%m%d%H%M%S')}"
    project_slug = slugify(project_name)
    
    project_data = {
        "source_video_url": request.video_url,
        "source_video_title": project_name,
        "project_name": project_name,
        "project_slug": project_slug,
        "status": "queued",
        "language": request.language,
        "storage_folder": f"videos/{project_slug}"
    }
    
    result = await supabase_request("POST", "projects", project_data)
    project = result[0] if result else None
    
    if project:
        # Trigger Kestra workflow
        background_tasks.add_task(trigger_kestra_workflow, "video-organizer", {"project_id": project["id"]})
    
    return project

@app.post("/api/projects/{project_id}/retry")
async def retry_project(project_id: str, background_tasks: BackgroundTasks):
    """Retry a failed project"""
    # Reset status to queued
    await supabase_request("PATCH", f"projects?id=eq.{project_id}", {
        "status": "queued",
        "error_message": None
    })
    
    # Trigger workflow
    background_tasks.add_task(trigger_kestra_workflow, "video-organizer", {"project_id": project_id})
    
    return {"status": "retrying"}

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    await supabase_request("DELETE", f"projects?id=eq.{project_id}")
    return {"status": "deleted"}

# ============================================
# SETTINGS ENDPOINTS
# ============================================

@app.get("/api/settings")
async def get_settings():
    """Get all settings"""
    return await supabase_request("GET", "settings?select=*")

@app.patch("/api/settings/{key}")
async def update_setting(key: str, update: SettingUpdate):
    """Update a setting"""
    import json
    try:
        value = json.loads(update.value)
    except:
        value = update.value
    
    result = await supabase_request("PATCH", f"settings?key=eq.{key}", {"value": value})
    return result[0] if result else None

# ============================================
# VOICE PROFILES ENDPOINTS
# ============================================

@app.get("/api/voice-profiles")
async def list_voice_profiles():
    """Get all voice profiles"""
    return await supabase_request("GET", "voice_profiles?select=*&order=language")

# ============================================
# WORKFLOW TRIGGERS
# ============================================

async def trigger_kestra_workflow(flow_id: str, inputs: dict):
    """Trigger a Kestra workflow"""
    async with httpx.AsyncClient() as client:
        # Use Kestra's execution API
        url = f"{KESTRA_URL}/api/v1/executions/{KESTRA_NAMESPACE}/{flow_id}"
        
        response = await client.post(
            url,
            json=inputs,
            headers={"Content-Type": "application/json"},
            timeout=30.0
        )
        
        if response.status_code >= 400:
            print(f"Failed to trigger workflow {flow_id}: {response.text}")
        else:
            print(f"Triggered workflow {flow_id}: {response.json()}")

@app.post("/api/trigger/scraper")
async def trigger_scraper(background_tasks: BackgroundTasks):
    """Manually trigger the idea scraper"""
    background_tasks.add_task(trigger_kestra_workflow, "idea-scraper", {"force_run": True})
    return {"status": "triggered"}

# ============================================
# STATS ENDPOINT
# ============================================

@app.get("/api/stats")
async def get_stats():
    """Get dashboard statistics"""
    channels = await supabase_request("GET", "channels?select=id,is_active")
    projects = await supabase_request("GET", "projects?select=id,status")
    
    status_counts = {}
    for p in projects:
        status = p.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return {
        "total_channels": len(channels),
        "active_channels": len([c for c in channels if c.get("is_active")]),
        "total_projects": len(projects),
        "projects_by_status": status_counts
    }

# ============================================
# STATIC FILES & FRONTEND
# ============================================

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main frontend"""
    return FileResponse("static/index.html")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
