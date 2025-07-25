// Fetches data of the faculties
async function getFaculties() {
    let url = "/api/v1/faculties"
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json()
        return json
    } catch (error) {
        console.error(error.message);
    }
}

async function getLessons(cdl, periodo_didattico) {
    console.log("Getting lessons")
    const params = new URLSearchParams();
    params.append("cdl", cdl);
    params.append("periodo_didattico", periodo_didattico);
    let url = `/api/v1/lessons?${params}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return json
    } catch (error) {
        console.error(error.message);
    }
}

function populateLessonTable() {
    courses_select = document.getElementById("course");
    periods_select = document.getElementById("periods");
    getLessons(courses_select.value, periods_select.value).then(
        (value) => {
            lesson_grid = document.getElementById("lesson-grid")
            lesson_grid.innerHTML = "";
            for (let index = 0; index < value.length; index++) {
                var lesson_div = document.createElement("div");
                var input = document.createElement("input");
                var label = document.createElement("label");
                input.type = "checkbox"
                input.name = "selectedLessons"
                input.value = value[index]["file"]
                input.id = value[index]["id"] + value[index]["file"]
                input.classList.add("hidden")
                label.htmlFor = input.id
                label.textContent = value[index]["nome"] + " | " + value[index]["terza_riga"] + " | " + value[index]["anno"] + " anno" + " | " + value[index]["docente"] + " | " + value[index]["crediti"] + " CFU"
                lesson_div.append(input)
                lesson_div.append(label)
                lesson_div.classList.add("lesson_div")
                lesson_grid.append(lesson_div)
                lesson_grid.append(document.createElement("br"))
            }
            document.querySelectorAll('[name="selectedLessons"]').forEach(checkbox => {
                const parentDiv = checkbox.parentElement;
                parentDiv.addEventListener("click", function() {
                    checkbox.checked = !checkbox.checked;
                    generate_calendar_url();
                    parentDiv.classList.toggle("selected", checkbox.checked);
                });
            });
        },
        (error) => { console.log(error) }
    );
}

// Generates the live calendar url
function generate_calendar_url() {
    calendar_url_box = document.getElementById("calendar_url");
    courses_select = document.getElementById("course");
    periods_select = document.getElementById("periods");
    selectedLessons = Array.from(document.getElementsByName("selectedLessons"))
        .filter(item => item.checked)
        .map(item => item.value)
        .join("|")
    calendar_url_box.value = window.location + "calendar/" + btoa(selectedLessons)
}

function reset_calendar_url() {
    calendar_url_box = document.getElementById("calendar_url");
    calendar_url_box.value = window.location + "calendar/"
}

// Function called when the body of the page is loaded. Used to populate the selects
function fetchData() {
    getFaculties().then(
        (value) => { populateFaculties(value) },
        (error) => { console.log(error) }
    );
    periods_select = document.getElementById("periods");
    periods_select.addEventListener("change", function() {
        populateLessonTable();
        reset_calendar_url();
    })
}

function populateFaculties(data) {
    // Populate faculties select
    const handler = () => {
        populateDegreeType(data[faculties_select.selectedIndex]);
        reset_calendar_url();
    }
    faculties_select = document.getElementById("faculties");
    faculties_select.innerHTML = "";
    faculties_select.onchange = handler;
    for (let index = 0; index < data.length; index++) {
        var opt = document.createElement("option");
        opt.value = index
        opt.innerHTML = data[index]["label"]
        faculties_select.append(opt)
    }
    populateDegreeType(data[faculties_select.selectedIndex])
}

function populateDegreeType(data) {
    const handler = () => {
        populateCourses(data[degree_select.selectedIndex]["elenco_cdl"]);
        reset_calendar_url();
    }
    data = data["elenco_lauree"]
    degree_select = document.getElementById("degree_type");
    degree_select.innerHTML = "";
    degree_select.onchange = handler;
    for (let index = 0; index < data.length; index++) {
        var opt = document.createElement("option");
        opt.value = index
        opt.innerHTML = data[index]["tipo"]
        degree_select.append(opt)
    }
    populateCourses(data[degree_select.selectedIndex]["elenco_cdl"])
}

function populateCourses(data) {
    const handler = () => {
        populatePeriods(data[courses_select.selectedIndex]["pub_periodi"]);
        reset_calendar_url();
    }
    courses_select = document.getElementById("course");
    courses_select.onchange = handler;
    courses_select.innerHTML = "";
    for (let index = 0; index < data.length; index++) {
        var opt = document.createElement("option");
        opt.value = data[index]["valore"]
        opt.innerHTML = data[index]["label"]
        courses_select.append(opt)
    }
    populatePeriods(data[courses_select.selectedIndex]["pub_periodi"])
}

function populatePeriods(data) {
    periods_select = document.getElementById("periods");
    periods_select.innerHTML = "";
    for (let index = 0; index < data.length; index++) {
        var opt = document.createElement("option");
        opt.value = data[index]["id"]
        opt.innerHTML = data[index]["label"]
        periods_select.append(opt)
    }
    populateLessonTable();
}
