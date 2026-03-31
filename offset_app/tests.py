from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch


class TimeOffsetsViewTest(TestCase):
    """
    Tests for the time_offsets view at /time/.
    """

    def setUp(self):
        # Create a test client to make requests to the app
        self.client = Client()

    # ── Test 1: Status code ────────────────────────────────────────────────
    def test_time_route_returns_200(self):
        """The /time/ page should load successfully (HTTP 200 OK)."""
        response = self.client.get('/time/')
        self.assertEqual(response.status_code, 200)

    # ── Test 2: "Four Hours Before" label appears in the page ─────────────
    def test_page_contains_four_hours_before(self):
        """The page should display the 'Four Hours Before' heading."""
        response = self.client.get('/time/')
        self.assertContains(response, 'Four Hours Before')

    # ── Test 3: "Current Date & Time" label appears in the page ──────────
    def test_page_contains_current_date_and_time(self):
        """The page should display the 'Current Date & Time' heading."""
        response = self.client.get('/time/')
        # assertContains checks the raw response bytes, so we match the
        # HTML-escaped version (&amp;) that Django renders in the template.
        self.assertContains(response, 'Current Date &amp; Time')

    # ── Test 4: "Four Hours Ahead" label appears in the page ─────────────
    def test_page_contains_four_hours_ahead(self):
        """The page should display the 'Four Hours Ahead' heading."""
        response = self.client.get('/time/')
        self.assertContains(response, 'Four Hours Ahead')


class TimeApiEndpointsTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_time_api_requires_timezone(self):
        response = self.client.get(reverse("time_api"))
        self.assertEqual(response.status_code, 400)

    @patch("offset_app.views._fetch_json")
    def test_time_api_returns_json(self, fetch_json):
        fetch_json.return_value = {
            "timestamp": 1700000000,
            "time": "10:13:44",
            "date": "2026-03-31",
            "timezone": "UTC",
            "abbr": "GMT",
            "offset": "+00:00",
            "iso8601": "2026-03-31T10:13:44+00:00",
        }

        response = self.client.get(reverse("time_api"), {"timezone": "UTC"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("timezone"), "UTC")
        self.assertIn("iso8601", response.json())

    @patch("offset_app.views._fetch_json")
    def test_timezones_api_returns_list(self, fetch_json):
        fetch_json.return_value = {"timezones": [{"name": "UTC"}, {"name": "Asia/Kolkata"}]}
        response = self.client.get(reverse("timezones_api"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(sorted(data.get("timezones") or []), ["Asia/Kolkata", "UTC"])
