from urllib.parse import urlparse, urljoin
from fastapi import Response
import httpx
import hishel
import json
import base64
from icalendar import Calendar, Event, vText
import xml.etree.ElementTree as ET
from datetime import datetime


def validate_url(url: str) -> bool:
    result = urlparse(url)
    return all([result.scheme, result.netloc])


class EasyStaff():
    SERVER_URL = "https://unica.easystaff.it"
    GET_FACULTIES_URL = ""
    GET_COURSES_URL = ""
    GET_CALENDAR_URL = ""

    def __init__(self, url: str):
        self.SERVER_URL = url
        self.GET_FACULTIES_URL = urljoin(
            self.SERVER_URL, "/AgendaWeb/api_profilo_aa_scuola_tipo_cdl_pd.php")
        self.GET_COURSES_URL = urljoin(
            self.SERVER_URL, "/AgendaWeb/api_profilo_lista_insegnamenti.php")
        self.GET_CALENDAR_URL = urljoin(
            self.SERVER_URL, "/AgendaWeb//App/zipped.php")
        storage = hishel.FileStorage(ttl=60 * 60 * 12)  # half day cache
        self.client = hishel.CacheClient(storage=storage)
        assert validate_url(self.SERVER_URL)
        assert validate_url(self.GET_FACULTIES_URL)
        assert validate_url(self.GET_COURSES_URL)
        assert validate_url(self.GET_CALENDAR_URL)

    def get_faculties(self):
        r = self.client.get(self.GET_FACULTIES_URL)
        if r.status_code == httpx.codes.OK:
            try:
                data = json.loads(r.text)
                return data
            except json.JSONDecodeError:
                return json.loads("[]")
        else:
            raise ValueError(
                "The request to get the faculties list has failed, check the url")

    def get_lessons(self, cdl: int, periodo_didattico: int):
        r = self.client.get(self.GET_COURSES_URL, params={
            'cdl': cdl, 'periodo_didattico': periodo_didattico})
        if r.status_code == httpx.codes.OK:
            try:
                data = json.loads(r.text)
                return data
            except json.JSONDecodeError:
                return json.loads("[]")
        else:
            raise ValueError(
                "The request to get the courses list has failed, check the url")

    def get_calendar(self, calendar_lessons: str):
        lessons_files = base64.b64decode(
            calendar_lessons).decode('utf-8').split("|")
        calendar = Calendar()
        calendar.add("prodid", "-//Lezioni Unica//")
        calendar.add("version", "2.0")

        for file_name in lessons_files:
            r = httpx.get(self.GET_CALENDAR_URL, params={
                'file': file_name})  # Will not be cached
            if r.status_code == httpx.codes.OK:
                xml_data = ET.fromstring(r.text)
                for lesson in xml_data.findall(".//Giorno"):
                    if lesson.get("Annullato", "0") == "0":
                        event = Event()
                        event_name = lesson.get("Titolo", "NomeLezione")
                        event.add('summary', event_name)
                        day = lesson.get("Data", "20-01-2025")
                        start_time = lesson.get("OraInizio", "15:00")
                        end_time = lesson.get("OraFine", "17:00")
                        format_string = "%d-%m-%Y-%H:%M"
                        start_date = datetime.strptime(
                            f"{day}-{start_time}", format_string)
                        end_date = datetime.strptime(
                            f"{day}-{end_time}", format_string)
                        event.add('dtstart', start_date)
                        event.add('dtend', end_date)
                        event['location'] = vText(lesson.get("Aula", ""))
                        event["uid"] = f"{event_name.replace(
                            ' ', '')}-{start_date.timestamp()}@unicacalendar"  # ID unico
                        calendar.add_component(event)
            else:
                raise ValueError(
                    "The request to get the courses list has failed, check the url")
        return Response(content=calendar.to_ical(), media_type="text/calendar")
