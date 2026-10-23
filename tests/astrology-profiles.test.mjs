import test from 'node:test';
import assert from 'node:assert/strict';
import {AstrologyProfiles,DATA_KEY,STUDY_KEY} from '../astrology-web/profiles.mjs';

class MemoryStorage{
  data=new Map();failRead=false;failWrite=false;
  getItem(key){if(this.failRead)throw Error('read disabled');return this.data.get(key)??null;}
  setItem(key,value){if(this.failWrite)throw Error('write disabled');this.data.set(key,value);}
  removeItem(key){if(this.failWrite)throw Error('write disabled');this.data.delete(key);}
}
const birth={date:'1988-05-20',time:'08:30',latitude:25,longitude:121,timeZone:'Asia/Taipei'};
const chart={placements:Array.from({length:10},(_,i)=>({body:i,longitude:i*30})),completeness:'complete'};

test('own charts, friends and learning data stay separate through selection and deletion',()=>{
  const storage=new MemoryStorage(),manager=new AstrologyProfiles(storage);
  const own=manager.add('profiles','我',birth,chart,'own-1');
  manager.add('friends','朋友 A',birth,chart,'friend-1');
  storage.setItem(STUDY_KEY,JSON.stringify({profiles:{'own-1':{notes:{'core-01':'原樣保留'}}}}));
  assert.equal(manager.active().id,own.id);
  assert.equal(manager.friend().id,'friend-1');
  assert.equal(new AstrologyProfiles(storage).active().name,'我');
  manager.remove('friends','friend-1');
  assert.equal(manager.friend(),null);
  assert.equal(manager.active().id,'own-1');
  assert.ok(storage.getItem(STUDY_KEY).includes('原樣保留'));
  manager.clear();
  assert.equal(storage.getItem(DATA_KEY),null);
  assert.equal(storage.getItem(STUDY_KEY),null);
});

test('corrupt previous data is never overwritten',()=>{
  const storage=new MemoryStorage();storage.setItem(DATA_KEY,'{broken');
  const manager=new AstrologyProfiles(storage);
  assert.equal(manager.corrupt,true);
  assert.throws(()=>manager.add('profiles','我',birth,chart,'own-1'),/無法讀取/);
  assert.equal(storage.getItem(DATA_KEY),'{broken');
});

test('disabled storage reports failure and recovers after access returns',()=>{
  const storage=new MemoryStorage();storage.failRead=true;
  const manager=new AstrologyProfiles(storage);
  assert.equal(manager.unavailable,true);
  storage.failRead=false;storage.failWrite=true;
  assert.throws(()=>manager.add('profiles','我',birth,chart,'own-1'),/儲存不可用/);
  assert.equal(manager.state.profiles.length,0);
  storage.failWrite=false;
  manager.add('profiles','我',birth,chart,'own-1');
  assert.equal(manager.active().name,'我');
});
