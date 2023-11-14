// All available units please do not customise anything here, can be set further down in the script
enum Units {
    Temperature_Celsius = 1,
    Temperature_Fahrenheit = 2,
    Pressure_hPa = 3,
    Pressure_inHg = 4,
    Pressure_mmHg = 5,
    WindSpeed_ms = 6,
    WindSpeed_kmh = 7,
    WindSpeed_knots = 8,
    WindSpeed_mph = 9,
    WindSpeed_BFT = 10,
    WindSpeed_fpm = 11,
    Rain_mm = 12,
    Rain_in = 13,
    SolarIrradiance_lux = 14,
    SolarIrradiance_fc = 15,
    SolarIrradiance_Wm = 16
}

// ####################################
// Please fill in with your own data
// 
// Customise user data folder if not the same
const userDataFolder = '0_userdata.0';
// Folder name where the data is saved. The folder must exist
const folderName: string = 'WeatherStation';
// API Key from https://www.ecowitt.net
const apiKey: string = 'REPLACE_WITH_YOUR_API_KEY';
// Application Key from https://www.ecowitt.net
const applicationKey: string = 'REPLACE_WITH_YOUR_APPLICATION_KEY';
// MAC from https://www.ecowitt.net Format 00:00:00:00:00:00:00
const stationMac = 'REPLACE_WITH_YOUR_MAC'
// Interval for API call in seconds
const apiCallInterval = 60;

// The units can be customised here, all have a default value
// Standard degrees Celsius
const temperatureUnit: number = Units.Temperature_Celsius;
// Standard air pressure in hectopascals
const pressureUnit: number = Units.Pressure_hPa;
// Standard wind speed in km/h
const windSpeedUnit: number = Units.WindSpeed_kmh;
// Standard rain in mm
const rainUnit: number = Units.Rain_mm;
// Standard illuminance in lux
const solarUnit: number = Units.SolarIrradiance_lux;

// #################################################################################################################
// Please do not make any adjustments to the script from here on if you do not know what you are doing
// #################################################################################################################
const dataFolder: string = `${userDataFolder}.${folderName}`;
const ecowittApiUrl: string = `https://api.ecowitt.net/api/v3/device/info?application_key=${applicationKey}&api_key=${apiKey}&mac=${stationMac}&temp_unitid=${temperatureUnit}&pressure_unitid=${pressureUnit}&wind_speed_unitid=${windSpeedUnit}&rainfall_unitid=${rainUnit}&solar_irradiance_unitid=${solarUnit}`;


if (existsObject(dataFolder)) {
    const cron = `*/${apiCallInterval} * * * * *`;
    console.log(`Start Ecowitt API Interval every ${apiCallInterval} seconds`);
    schedule(cron, async () => {
      await apiCall();
    });
} else {
    console.error(`Bitte Ordner ${folderName} in ${userDataFolder} erstellen`);
}


async function apiCall() {
    try {
        require("request")(ecowittApiUrl, async (error, response, result) => {
            if (!error && response.statusCode === 200) {
                var jsonResult = JSON.parse(result);
                if (jsonResult.data.length < 1) {
                    console.error(`Response error ${jsonResult.msg} Code -> ${jsonResult.code}`);
                }
                else {
                    await createStationInfos(jsonResult.data);
                    var lastUpdateObj = jsonResult.data.last_update;
                    for (var name in lastUpdateObj) {
                        var items = lastUpdateObj[name];
                        for (var item in items) {
                            var stateName = `${name}_${item}`;
                            if (existsState(`${dataFolder}.${stateName}`)) {
                                await setStateAsync(`${dataFolder}.${stateName}`, parseFloat(items[item].value), true);
                            } else {
                                console.log(`Ecowitt script create a new state -> ${stateName}`);
                                const stateHumanName = `${name.charAt(0).toUpperCase() + name.slice(1)} ${item.charAt(0).toUpperCase() + item.slice(1)}`;
                                await createUserStates(`${dataFolder}.${stateName}`, stateHumanName, items[item].unit, parseFloat(items[item].value));
                            }
                        }
                    }
                }
            } else {
                console.error('Error in Ecowitt API Call => ', response);
            }
    });
    }
    catch(e) {
        console.error(e);
    }

}

async function createUserStates(folder: string, name: string, unit: string, value: number) {
    const obj = {
            type: 'number',
            read: true,
            write: true,
            name: name,
            def: value,
            unit: unit
    }
    await createStateAsync(folder, obj);
};
async function createStationInfos(json: any) {
    const stationName = json.name;
    const dateZone = json.date_zone_id;
    const longitude = json.longitude;
    const latitude = json.latitude;
    const stationType = json.stationtype;
    if (!existsState(`${dataFolder}.name`)) {
        console.log(`Ecowitt script create a new state -> name`);
        await createStateAsync(`${dataFolder}.name`, {type: 'string', read: true, write: true, name: 'Station Name', def: stationName });
    } else {
        await setStateAsync(`${dataFolder}.name`, stationName, true);
    }
    if (!existsState(`${dataFolder}.dateZone`)) {
        console.log(`Ecowitt script create a new state -> dateZone}`);
        await createStateAsync(`${dataFolder}.dateZone`, {type: 'string', read: true, write: true, name: 'Station Date Zone', def: dateZone });

    } else {
        await setStateAsync(`${dataFolder}.dateZone`, dateZone, true);
    }
    if (!existsState(`${dataFolder}.longitude`)) {
        console.log(`Ecowitt script create a new state -> longitude`);
        await createStateAsync(`${dataFolder}.longitude`, {type: 'number', read: true, write: true, name: 'Station Longitude', def: parseFloat(longitude) });
    } else {
        setState(`${dataFolder}.longitude`, parseFloat(longitude), true);
    }
    if (!existsState(`${dataFolder}.latitude`)) {
        console.log(`Ecowitt script create a new state -> latitude`);
        await createStateAsync(`${dataFolder}.latitude`, {type: 'number', read: true, write: true, name: 'Station Latitude', def: parseFloat(latitude) });
    } else {
        await setStateAsync(`${dataFolder}.latitude`, parseFloat(latitude), true);
    } 
    if (!existsState(`${dataFolder}.stationtype`)) {
        console.log(`Ecowitt script create a new state -> stationtype`);
        await createStateAsync(`${dataFolder}.stationtype`, {type: 'string', read: true, write: true, name: 'Station Type', def: stationType });
    } else {
        await setStateAsync(`${dataFolder}.stationtype`, stationType, true);
    }
}
export{};
