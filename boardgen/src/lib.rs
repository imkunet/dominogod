use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}

#[wasm_bindgen]
pub struct Board {
    pub ones: u64,
    pub twos: u64,
    pub nope: u64,
}
