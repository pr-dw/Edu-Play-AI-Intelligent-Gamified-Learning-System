from django.urls import path
from .views import (
    AdminOverviewView, AdminUserListView, AdminCourseListView,
    AdminSettingsView, AdminSeedDataView
)

app_name = 'administration'

urlpatterns = [
    path('overview/', AdminOverviewView.as_view(), name='admin_overview'),
    path('users/', AdminUserListView.as_view(), name='admin_users'),
    path('courses/', AdminCourseListView.as_view(), name='admin_courses'),
    path('settings/', AdminSettingsView.as_view(), name='admin_settings'),
    path('seed/', AdminSeedDataView.as_view(), name='admin_seed'),
]
