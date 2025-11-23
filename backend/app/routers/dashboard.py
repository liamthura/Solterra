from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import List, Dict

from app.database import get_db
from app.utils.security import get_current_admin
from app.models.admin import Admin
from app.models.event import Event, EventStatus
from app.models.booking import Booking
from app.models.participant import Participant
from app.models.test_result import TestResult

router = APIRouter(prefix="/admin/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get dashboard statistics for admin"""
    
    # Active Events (published and future)
    today = datetime.now().date()
    active_events = db.query(Event).filter(
        Event.status == EventStatus.published,
        Event.event_date >= today,
        Event.created_by == current_admin.id
    ).count()
    
    # Total Participants (unique from bookings)
    total_participants = db.query(func.count(func.distinct(Booking.participant_id))).filter(
        Booking.event_id.in_(
            db.query(Event.id).filter(Event.created_by == current_admin.id)
        )
    ).scalar()
    
    # Tests Completed
    tests_completed = db.query(TestResult).join(Booking).join(Event).filter(
        Event.created_by == current_admin.id
    ).count()
    
    # Bookings This Month
    current_month = datetime.now().month
    current_year = datetime.now().year
    bookings_this_month = db.query(Booking).join(Event).filter(
        Event.created_by == current_admin.id,
        extract('month', Booking.booked_at) == current_month,
        extract('year', Booking.booked_at) == current_year
    ).count()
    
    return {
        "active_events": active_events,
        "total_participants": total_participants or 0,
        "tests_completed": tests_completed,
        "bookings_this_month": bookings_this_month
    }


@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
    limit: int = 10
):
    """Get recent activity for admin's events"""
    
    activities = []
    
    # Recent bookings
    recent_bookings = (
        db.query(Booking)
        .join(Event)
        .join(Participant)
        .filter(Event.created_by == current_admin.id)
        .order_by(Booking.booked_at.desc())
        .limit(5)
        .all()
    )
    
    for booking in recent_bookings:
        activities.append({
            "type": "booking",
            "message": f"User {booking.participant.name} booked {booking.event.name}",
            "timestamp": booking.booked_at.isoformat(),
            "entity_id": str(booking.id)
        })
    
    # Recent results uploaded
    recent_results = (
        db.query(TestResult)
        .join(Booking)
        .join(Event)
        .filter(Event.created_by == current_admin.id)
        .order_by(TestResult.uploaded_at.desc())
        .limit(3)
        .all()
    )
    
    for result in recent_results:
        activities.append({
            "type": "result",
            "message": f"Test result uploaded for {result.booking.participant.name} - {result.result_category}",
            "timestamp": result.uploaded_at.isoformat(),
            "entity_id": str(result.id)
        })
    
    # Recent events created
    recent_events = (
        db.query(Event)
        .filter(Event.created_by == current_admin.id)
        .order_by(Event.created_at.desc())
        .limit(2)
        .all()
    )
    
    for event in recent_events:
        activities.append({
            "type": "event",
            "message": f"New event added: {event.name}",
            "timestamp": event.created_at.isoformat() if hasattr(event, 'created_at') else datetime.now().isoformat(),
            "entity_id": str(event.id)
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "activities": activities[:limit]
    }


@router.get("/booking-trends")
def get_booking_trends(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get booking trends for the past 4 weeks"""
    
    today = datetime.now().date()
    trends = []
    
    for week in range(4):
        week_start = today - timedelta(days=7 * (week + 1))
        week_end = today - timedelta(days=7 * week)
        
        bookings_count = db.query(Booking).join(Event).filter(
            Event.created_by == current_admin.id,
            Booking.booked_at >= week_start,
            Booking.booked_at < week_end
        ).count()
        
        trends.append({
            "week": f"{week + 1} week(s) ago",
            "count": bookings_count,
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat()
        })
    
    # Reverse to show oldest first
    trends.reverse()
    
    return {
        "trends": trends
    }


@router.get("/event-capacity")
def get_event_capacity_overview(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """Get capacity overview for upcoming events"""
    
    today = datetime.now().date()
    
    upcoming_events = (
        db.query(Event)
        .filter(
            Event.created_by == current_admin.id,
            Event.event_date >= today,
            Event.status == EventStatus.published
        )
        .order_by(Event.event_date.asc())
        .limit(5)
        .all()
    )
    
    capacity_data = []
    for event in upcoming_events:
        booked_slots = event.total_slots - event.available_slots
        capacity_percentage = (booked_slots / event.total_slots * 100) if event.total_slots > 0 else 0
        
        capacity_data.append({
            "event_id": str(event.id),
            "event_name": event.name,
            "event_date": str(event.event_date),
            "total_slots": event.total_slots,
            "booked_slots": booked_slots,
            "available_slots": event.available_slots,
            "capacity_percentage": round(capacity_percentage, 1)
        })
    
    return {
        "events": capacity_data
    }