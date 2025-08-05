async function getLatandLong(city){
    try{
        const urlCity = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
        const response = await fetch(urlCity)
        if(!response.ok)
            throw new Error("Response status:" , response.status)

        const data = await response.json()
        const LatLong = {
            lat: data.results[0].latitude,
            long: data.results[0].longitude
        }
        return LatLong
    }catch (err){
        console.error(err.message)
    }
}

async function getWeather(city){
    try{
        const coords = await getLatandLong(city)
        const urlWeather = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.long}&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&hourly=temperature_2m,weather_code,uv_index&current=temperature_2m,weather_code,precipitation,relative_humidity_2m&timezone=GMT&forecast_days=14`
        console.log(coords.lat)

        const resp = await fetch(urlWeather)

        const data = await resp.json()
        console.log(data)
        return data
    }
    catch (err){
        console.log(err.message)
    }
}

function getName(day){
    const days = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă']
    return days[day]
}

function weatherCode(code){
      switch (code) {
        case 0: return 'Cer senin';
        case 1: return 'Mai ales senin';
        case 2: return 'Parțial noros';
        case 3: return 'Complet înnorat';
        case 45: return 'Ceață';
        case 48: return 'Ceață cu depuneri de chiciură';
        case 51: return 'Burniță slabă';
        case 53: return 'Burniță moderată';
        case 55: return 'Burniță densă';
        case 56: return 'Burniță înghețată slabă';
        case 57: return 'Burniță înghețată densă';
        case 61: return 'Ploaie slabă';
        case 63: return 'Ploaie moderată';
        case 65: return 'Ploaie puternică';
        case 71: return 'Ninsoare slabă';
        case 73: return 'Ninsoare moderată';
        case 75: return 'Ninsoare puternică';
        case 77: return 'Fulguială (fulgi mici)';
        case 80: return 'Averse de ploaie slabe';
        case 81: return 'Averse de ploaie moderate';
        case 82: return 'Averse de ploaie violente';
        case 85: return 'Averse de zăpadă slabe';
        case 86: return 'Averse de zăpadă puternice';
        case 95: return 'Furtună slabă sau moderată';
        case 96: return 'Furtună cu grindină slabă';
        case 99: return 'Furtună cu grindină puternică';
        default: return 'Cod meteo necunoscut';
    }
}   
function getWeatherIcon(code)
{
    return `icons/${code}.png`
}
function createWeatherCard({ dayName, code, max, min, currentTemp, currentUv,isToday=false }) {
    const card = document.createElement('div');
    const continut = document.createElement('div')
    continut.className = 'continut'
    card.className = 'card';

    const img = document.createElement('img');
    img.src = getWeatherIcon(code);
    img.className = 'icon';

    const day = document.createElement('p');
    day.textContent = dayName;

    const description = document.createElement('p');
    description.textContent = weatherCode(code);

    const max_min = document.createElement('p')
    max_min.innerHTML = `${max}/${min}<span class="celsius">°C</span>`
    max_min.className='max-min'

    const uv = document.createElement('p')
    uv.innerHTML = `Indice UV: <span class="uv-index">${currentUv}</span>`

    continut.append(day, img, description, max_min, uv);
    card.append(continut)

    if (currentTemp !== undefined) {
        const current = document.createElement('p');
        current.innerHTML = currentTemp + `<span class="celsius">°C</span>`;
        current.id = 'current-temp';
        continut.className +='-azi'
        continut.insertBefore(current, description);
    }
    const button = document.createElement('button')
    button.id = 'hourly-btn'
    button.textContent = "Pe oră"
    if (isToday)
    { 
        day.className = "zi-curenta"
        card.className += ' azi'
        
        continut.appendChild(button)
    }
    else
        day.className = 'nume-zi';

    return card;
}
function hourlyWeather(day,temps, hours,uvs){
    const azi = document.createElement("div")
    azi.className = 'card azi hourly'

    const zi = document.createElement('p')
    zi.className="zi-curenta"
    zi.textContent = day
    azi.append(zi)
    const div =document.createElement('div')
    div.className = 'hourly-wrapper'
    azi.append(div)

    for (let i = 0; i< temps.length; i++){
        const ceva = document.createElement('div')
        ceva.className = 'hourly-today'
        ceva.innerHTML = `<span class=ora>${hours[i]}</span><span class=temp>${temps[i]}°C</span><span>UV: ${uvs[i]}</span>`
      
        div.appendChild(ceva)
    }
    const continut = document.querySelector('.continut-azi')
    continut.style.display = 'none'
    document.querySelector('.card').appendChild(azi)

    const back = document.createElement('button')
    back.textContent = "Inapoi"
    back.className='btn'
    azi.append(back)

    back.addEventListener('click', () =>{
        azi.style.display='none'
        continut.style.display = 'flex'
    })

}

async function printeazaMeteo(city){
    try{
        const results = await getWeather(city)
        const date = new Date()

        let nr = date.getDay()
        let today = getName(nr)

        const daily = results.daily
        //nume oras
        const cityName = document.getElementById('city')
        cityName.textContent = city


        //uv index
        const now = new Date()
        const isoHour = now.toISOString().slice(0,13) + ":00"
        const hourIndex = results.hourly.time.indexOf(isoHour) //cautam indexul la ora curenta
        const currentUv = results.hourly.uv_index[hourIndex] //luam uv current dupa indexul orei curente

        // Obține ziua curentă în format YYYY-MM-DD
        const currentDate = now.toISOString().split("T")[0];

        // Extrage temperaturile doar pentru ziua curentă
        let temps = [];
        let hours = [];
        let uvs = []

        for (let i = 0; i < results.hourly.time.length; i+=2) {
            if (results.hourly.time[i].startsWith(currentDate)) {
                const hour = new Date(results.hourly.time[i]).getHours();
                temps.push(results.hourly.temperature_2m[i]);
                hours.push(`${hour}:00`);
                uvs.push(results.hourly.uv_index[i])
            }
        }


        //primul cartonas
        const card = createWeatherCard({
            dayName: today,
            code: results.current.weather_code,
            max: daily.temperature_2m_max[0],
            min: daily.temperature_2m_min[0],
            currentTemp: results.current.temperature_2m,
            currentUv: currentUv,
            isToday: true
        })
        nr++
        document.querySelector('.body').appendChild(card)

        const hourly_btn = document.getElementById('hourly-btn')
        hourly_btn.addEventListener('click', ()=>{
            hourlyWeather(today,temps,hours,uvs)
        })

        //celalte cartonase
        for (let i = 1 ; i<14; i++){
            if (nr > 6)
                nr = 0

            const uv_index = daily.uv_index_max[i]
            const card =createWeatherCard({
                dayName: getName(nr++),
                code: daily.weather_code[i],
                max: daily.temperature_2m_max[i],
                min:daily.temperature_2m_min[i],
                currentUv:uv_index
            })
            document.querySelector('.body').appendChild(card)
        }
    }
    catch (err){
        console.error(err.message)
        document.querySelector('.body').innerHTML = `<p class="error">Locația introdusă nu există!</p>`;
    }
}
async function getWeatherUI(){
   const city =  document.getElementById('search-bar').value
   const cont = document.querySelector('.body')
   cont.innerHTML = ''
   if(city === '')
        await printeazaMeteo('Sibiu')
    else{
        await printeazaMeteo(city)
    }
}
