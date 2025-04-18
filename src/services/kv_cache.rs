use serde::de::DeserializeOwned;
use serde::Serialize;

static EVENT_CACHE_PATH: &str = "/tmp/discord_bot_cache";

#[derive(Debug)]
pub struct KVCache {
    db: sled::Db,
}

impl KVCache {
    pub fn new() -> Result<Self, anyhow::Error> {
        let db = sled::open(EVENT_CACHE_PATH)?;
        Ok(KVCache { db })
    }

    pub fn get<K: AsRef<[u8]>, V: DeserializeOwned>(&self, key: K) -> Result<Option<V>, anyhow::Error> {
        match self.db.get(key)? {
            Some(value) => bincode::serde::decode_from_slice(&value, bincode::config::standard())
                .map(|(s, _)| Some(s))
                .map_err(Into::into),
            None => Ok(None),
        }
    }

    pub fn set<K: AsRef<[u8]>, V: Serialize>(&self, key: K, value: V) -> Result<(), anyhow::Error> {
        let encoded: Vec<u8> = bincode::serde::encode_to_vec(value, bincode::config::standard())?;
        self.db.insert(key, encoded)?;
        self.db.flush()?;
        Ok(())
    }

    pub fn remove(&self, key: &str) -> Result<(), anyhow::Error> {
        self.db.remove(key)?;
        self.db.flush()?;
        Ok(())
    }
}
