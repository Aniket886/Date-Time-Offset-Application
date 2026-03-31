from django.urls import path
from . import views

urlpatterns = [
    path('', views.time_offsets, name='time_offsets'),
    path('api/timezones/', views.timezones_api, name='timezones_api'),
    path('api/time/', views.time_api, name='time_api'),
]
