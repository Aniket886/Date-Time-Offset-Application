"""
URL configuration for datetime_project project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('offset_app.urls')),
    path('time/', include('offset_app.urls')),
    path('chat/', include('chatbot.urls')),
]
