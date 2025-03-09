from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from easystaff import EasyStaff


SERVER_URL = "https://unica.easystaff.it"
app = FastAPI()
easystaff = EasyStaff(SERVER_URL)


@app.get("/api/v1/faculties")
def faculties():
    return easystaff.get_faculties()


@app.get("/api/v1/lessons")
def lessons(cdl: int, periodo_didattico: int):
    return easystaff.get_lessons(cdl, periodo_didattico)


@app.get("/calendar/{calendar_lessons}")
def calendar(calendar_lessons: str):
    return easystaff.get_calendar(calendar_lessons)


app.mount("/", StaticFiles(directory="static", html=True), name="static")
