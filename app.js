const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbFilePath = path.join(__dirname, "./covid19India.db");
let database = null;
const port = 3000;

const connectDatabaseWithServer = async () => {
  try {
    database = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Started...!`);
    });
  } catch (error) {
    console.log(`Connection Error: ${error}`);
  }
};

connectDatabaseWithServer();

const statesArrangeKeys = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const districtArrangeKeys = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

app.get("/states/", async (req, res) => {
  let getAllStates = `SELECT * FROM state`;
  let dbResponse = await database.all(getAllStates);
  res.send(dbResponse.map((el) => statesArrangeKeys(el)));
});

app.get("/states/:stateId", async (req, res) => {
  let { stateId } = req.params;
  let getState = `SELECT * FROM state WHERE state_id = '${stateId}'`;
  let dbResponse = await database.get(getState);
  res.send(statesArrangeKeys(dbResponse));
});

app.post("/districts/", async (req, res) => {
  let addDistrict = req.body;
  let { districtName, stateId, cases, cured, active, deaths } = addDistrict;
  let addDistrictQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')`;
  let dbResponse = await database.run(addDistrictQuery);
  res.send(`District Successfully Added`);
});

app.get("/districts/:districtId/", async (req, res) => {
  let { districtId } = req.params;
  let getDistrictQuery = `SELECT * FROM district WHERE district_id = '${districtId}'`;
  let dbResponse = await database.get(getDistrictQuery);
  res.send(districtArrangeKeys(dbResponse));
});

app.delete("/districts/:districtId/", async (req, res) => {
  let { districtId } = req.params;
  let deleteQuery = `DELETE FROM district WHERE district_id = '${districtId}'`;
  let dbResponse = database.run(deleteQuery);
  res.send(`District Removed`);
});

app.put("/districts/:districtId/", async (req, res) => {
  let { districtId } = req.params;
  let updateDistrict = req.body;
  let { districtName, stateId, cases, cured, active, deaths } = updateDistrict;
  let updateDistrictQuery = `UPDATE district SET district_name ='${districtName}',state_id ='${stateId}', cases ='${cases}', cured ='${cured}',active ='${active}',deaths='${deaths}' WHERE district_id = '${districtId}'`;
  let dbResponse = await database.run(updateDistrictQuery);
  res.send(`District Details Updated`);
});

app.get("/states/:stateId/stats/", async (req, res) => {
  let { stateId } = req.params;
  let statsQuery = `SELECT sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths FROM district WHERE state_id = '${stateId}'`;
  let dbResponse = await database.get(statsQuery);
  res.send(dbResponse);
});

app.get("/districts/:districtId/details/", async (req, res) => {
  let { districtId } = req.params;
  let findStateQuery = `SELECT state_name FROM district INNER JOIN state ON district.state_id = state.state_id WHERE district.district_id = '${districtId}'`;
  let dbResponse = await database.get(findStateQuery);
  res.send(statesArrangeKeys(dbResponse));
});

module.exports = app;
