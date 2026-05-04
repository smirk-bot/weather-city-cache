'use strict'
const { DataApiClient } = require('rqlite-js')
const log = require('./logger')

const CACHE_HOSTS = process.env.TOKEN_CACHE_URL || ['http://bot-cache-0.bot-cache-internal.datastore.svc.cluster.local:4001', 'http://bot-cache-1.bot-cache-internal.datastore.svc.cluster.local:4001', 'http://bot-cache-2.bot-cache-internal.datastore.svc.cluster.local:4001']

const dataApiClient = new DataApiClient(CACHE_HOSTS)
let CACHE_READY
const reportError = (dataResults)=>{
  let err = dataResults?.getFirstError()
  if(err) log.error(err)
}
async function init(){
  try{
    let sql = `CREATE TABLE IF NOT EXISTS cities (id TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT, admin1 TEXT, admin2 TEXT, lat TEXT, lon TEXT, pop TEXT)`
    let dataResults = await dataApiClient.execute(sql)
    if(dataResults?.hasError()){
      reportError(dataResults)
      setTimeout(init, 5000)
      return
    }
    log.info(`created rqlite table cities`)
    CACHE_READY = true
  }catch(e){
    log.error(e)
    setTimeout(init, 5000)
  }
}
init()
async function all(){
  try{
    if(!CACHE_READY) return
    let sql = `SELECT * FROM cities`
    let dataResults = await dataApiClient.query(sql)
    if(dataResults.hasError()){
      reportError(dataResults)
      return
    }
    return dataResults?.toArray()
  }catch(e){
    log.error(e)
  }
}
async function getIds(){
  try{
    if(!CACHE_READY) return
    let sql = `SELECT id FROM cities`
    let dataResults = await dataApiClient.query(sql)
    if(dataResults.hasError()){
      reportError(dataResults)
      return
    }
    let data = dataResults?.toArray()
    return data?.map(x=>x.id)
  }catch(e){
    log.error(e)
  }
}
async function set(data){
  try{
    if(!data || !CACHE_READY) return
    let sql = [
      [`INSERT OR REPLACE INTO cities(id, name, country, admin1, admin2, lat, lon, pop) VALUES(:id, :name, :country, :admin1, :admin2, :lat, :lon, :pop)`, data]
    ]
    let dataResults = await dataApiClient.execute(sql)
    if(dataResults?.hasError()){
      reportError(dataResults)
      return
    }
    return dataResults?.get(0)?.getRowsAffected()
  }catch(e){
    log.error(e)
  }
}
async function get(id){
  try{
    if(!id || !CACHE_READY) return
    let sql = `SELECT * FROM cities WHERE id=${id.toString()}`
    let res = await dataApiClient.query(sql)
    if(res.hasError()){
      reportError(res)
      return
    }
    return res.get(0)
  }catch(e){
    log.error(e)
  }
}
async function del(id){
  try{
    if(!id || !CACHE_READY) return
    let sql = `DELETE FROM cities WHERE id=${id.toString()}`
    let dataResults = await dataApiClient.execute(sql)
    if(dataResults?.hasError()){
      reportError(dataResults)
      return
    }
    return dataResults?.get(0)?.getRowsAffected()
  }catch(e){
    log.error(e)
  }
}
module.exports = {
  all, del, get, getIds, set, status: ()=>{ return CACHE_READY }
}
