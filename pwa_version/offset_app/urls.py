from django.urls import path
from . import views

app_name = "offset_app"

urlpatterns = [
    path("", views.time_offsets, name="time_offsets"),
    path("time/", views.time_offsets, name="time_page"),
    path("api/timezones/", views.timezones_api, name="timezones_api"),
    path("api/time/", views.time_api, name="time_api"),
]
