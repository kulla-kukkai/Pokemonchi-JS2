// CLASS: Pokemon
class Pokemon {
    constructor(name, animalType) {
        this.name       = name;
        this.animalType = animalType;  
        this.energy     = 50;          
        this.fullness   = 50;          
        this.happiness  = 50;          
        this.countdown  = null;        // เก็บ timer ไว้เพื่อหยุดได้ภายหลัง
    }

    // ---- nap ----
    nap() {
        this.energy    = Math.min(100, this.energy + 40);
        this.happiness = Math.max(0,   this.happiness - 10);
        this.fullness  = Math.max(0,   this.fullness - 10);
        PokemonCenter.addLog(`${this.name} took a nap! 😴`);
        this.checkIfRunsAway();
    }

    // ---- eat ----
    eat() {
        this.fullness  = Math.min(100, this.fullness + 30);
        this.happiness = Math.min(100, this.happiness + 5);
        this.energy    = Math.max(0,   this.energy - 15);
        PokemonCenter.addLog(`${this.name} ate food! 🍕`);
        this.checkIfRunsAway();
    }

    // ---- play ----
    play() {
        this.happiness = Math.min(100, this.happiness + 30);
        this.fullness  = Math.max(0,   this.fullness - 10);
        this.energy    = Math.max(0,   this.energy - 10);
        PokemonCenter.addLog(`${this.name} played! 🎮`);
        this.checkIfRunsAway();
    }

    // ---- เริ่ม countdown: ลดค่าทุก 10 วินาที ----
    startCountdown() {
        this.countdown = setInterval(() => {
            this.energy    = Math.max(0, this.energy - 10);
            this.fullness  = Math.max(0, this.fullness - 10);
            this.happiness = Math.max(0, this.happiness - 10);
            this.checkIfRunsAway();
        }, 10000);
    }

    // ---- หยุด countdown ----
    stopCountdown() {
        if (this.countdown) {
            clearInterval(this.countdown);
        }
    }

    // ---- ตรวจว่าค่าใดค่าหนึ่งถึง 0 ไหม → ถ้าใช่ หนีไป! ----
    checkIfRunsAway() {
        if (this.energy <= 0 || this.fullness <= 0 || this.happiness <= 0) {
            PokemonCenter.releasePokemon(this);
        } else {
            // ยังมีชีวิต → อัปเดตการ์ดให้แสดงค่าใหม่
            PokemonCenter.updateCard(this);
        }
    }

    // ---- รูปภาพ ----
    getSprite() {
        return `images/${this.animalType}.png`;
    }

    // ---- ดึงชื่อจาก API ----
    static async fetchRandomName() {
        const response = await fetch("https://randomuser.me/api/");
        const data     = await response.json();
        return data.results[0].name.first;
    }
}


// CLASS: PokemonCenter
// จัดการรายชื่อโปเกมอน, การ์ด, และ log


class PokemonCenter {

    // รายชื่อโปเกมอนทั้งหมดที่มีชีวิตอยู่
    // static = เป็นของ class ทั้งก้อน ไม่ใช่ของแต่ละตัว
    static pokedex = [];

    // ---- เริ่มเกม ----
    static init() {
        PokemonCenter.showScreen("create-screen");
    }

    // ---- สลับหน้าจอ ----
    static showScreen(screenId) {
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        document.getElementById(screenId).classList.add("active");
    }

    // ---- สร้างโปเกมอนใหม่ ----
    static async createNewPokemon() {
        const nameInput = document.getElementById("nameInput").value.trim();
        const typeInput = document.getElementById("typeInput").value;
        const msgBox    = document.getElementById("formMessage");

        // ตรวจสอบ: เลือกประเภทไหม?
        if (!typeInput) {
            msgBox.textContent = "Please choose a Pokémon type!";
            msgBox.className   = "message error";
            return;
        }

        // ตรวจสอบ: ครบ 4 ตัวแล้วไหม?
        if (PokemonCenter.pokedex.length >= 4) {
            msgBox.textContent = "You can only have 4 Pokémon!";
            msgBox.className   = "message error";
            return;
        }

        // หาชื่อ: ถ้าใส่มาเองใช้นั้น ถ้าไม่มีให้ดึงจาก API
        let name = nameInput;
        if (!name) {
            try {
                name = await Pokemon.fetchRandomName();
            } catch {
                msgBox.textContent = "Could not fetch name from API";
                msgBox.className   = "message error";
                return;
            }
        }

        // สร้างโปเกมอนตัวใหม่
        const newPokemon = new Pokemon(name, typeInput);
        PokemonCenter.pokedex.push(newPokemon);  // เพิ่มเข้า array
        newPokemon.startCountdown();             // เปิด timer

        PokemonCenter.addLog(`${name} was created! 🎉`);
        PokemonCenter.addCard(newPokemon);       // สร้างการ์ดบนหน้าเกม
        PokemonCenter.showScreen("game-screen");

        // ล้างฟอร์ม
        document.getElementById("nameInput").value = "";
        document.getElementById("typeInput").value = "";
        msgBox.textContent = "";
    }

    // ---- สร้างการ์ด HTML สำหรับโปเกมอนตัวหนึ่ง ----
    static addCard(pokemon) {
        const petsArea = document.getElementById("petsArea");

        const card = document.createElement("div");
        card.classList.add("pokemon-card");
        card.id = `card-${pokemon.name}`;  // id ไม่ซ้ำกัน เพื่อหาการ์ดทีหลัง

        card.innerHTML = `
            <div class="card-screen">
                <img class="pokemon-sprite" src="${pokemon.getSprite()}" alt="${pokemon.name}">
                <p class="pokemon-name">${pokemon.name}</p>
                <p class="pokemon-type">${pokemon.animalType}</p>

                <div class="stats">
                    <div class="stat-row">
                        <span class="stat-label">Energy</span>
                        <div class="bar">
                            <div class="bar-fill energy" id="bar-energy-${pokemon.name}" style="width:${pokemon.energy}%"></div>
                        </div>
                        <span class="stat-val" id="val-energy-${pokemon.name}">${pokemon.energy}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Fullness</span>
                        <div class="bar">
                            <div class="bar-fill fullness" id="bar-fullness-${pokemon.name}" style="width:${pokemon.fullness}%"></div>
                        </div>
                        <span class="stat-val" id="val-fullness-${pokemon.name}">${pokemon.fullness}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Happiness</span>
                        <div class="bar">
                            <div class="bar-fill happy" id="bar-happy-${pokemon.name}" style="width:${pokemon.happiness}%"></div>
                        </div>
                        <span class="stat-val" id="val-happy-${pokemon.name}">${pokemon.happiness}</span>
                    </div>
                </div>
            </div>

            <div class="card-btns">
                <button class="game-btn btn-nap">NAP</button>
                <button class="game-btn btn-eat">EAT</button>
                <button class="game-btn btn-play">PLAY</button>
            </div>
        `;

        // ผูกปุ่มกับ method ของโปเกมอนตัวนั้น
        const btns = card.querySelectorAll(".card-btns .game-btn");
        btns[0].addEventListener("click", () => pokemon.nap());
        btns[1].addEventListener("click", () => pokemon.eat());
        btns[2].addEventListener("click", () => pokemon.play());

        petsArea.appendChild(card);
    }

    // ---- อัปเดตตัวเลขและ bar บนการ์ด ----
    static updateCard(pokemon) {
        document.getElementById(`bar-energy-${pokemon.name}`).style.width    = `${pokemon.energy}%`;
        document.getElementById(`val-energy-${pokemon.name}`).textContent    = pokemon.energy;

        document.getElementById(`bar-fullness-${pokemon.name}`).style.width  = `${pokemon.fullness}%`;
        document.getElementById(`val-fullness-${pokemon.name}`).textContent  = pokemon.fullness;

        document.getElementById(`bar-happy-${pokemon.name}`).style.width     = `${pokemon.happiness}%`;
        document.getElementById(`val-happy-${pokemon.name}`).textContent     = pokemon.happiness;
    }

    // ---- ปล่อยโปเกมอนที่ไม่ได้รับการดูแล (ค่าถึง 0) ----
    static releasePokemon(pokemon) {
        pokemon.stopCountdown();
        PokemonCenter.addLog(`${pokemon.name} ran away! 💔`);

        // ลบออกจาก array
        PokemonCenter.pokedex = PokemonCenter.pokedex.filter(p => p !== pokemon);

        // ลบการ์ดออกจากหน้าจอ พร้อม animation
        const card = document.getElementById(`card-${pokemon.name}`);
        if (card) {
            card.classList.add("dying");
            setTimeout(() => {
                card.remove();

                // ถ้าไม่มีโปเกมอนเหลือเลย → กลับหน้า create พร้อมข้อความ
                if (PokemonCenter.pokedex.length === 0) {
                    document.getElementById("create-log").textContent = "All Pokémon ran away... Create a new one! 🥺";
                    PokemonCenter.showScreen("create-screen");
                }
            }, 500);
        }
    }

    // ---- เพิ่มข้อความลง log ----
    static addLog(message) {
        const log = document.getElementById("gameLog");
        if (!log) return;

        const time = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const entry = document.createElement("div");
        entry.className   = "log-entry";
        entry.textContent = `[${time}] ${message}`;

        log.prepend(entry);  // ใหม่อยู่บนสุด

        // เก็บไว้แค่ 20 รายการล่าสุด
        while (log.children.length > 20) {
            log.removeChild(log.lastChild);
        }
    }
}



// ผูก Event ทั้งหมดเมื่อหน้าเว็บโหลดเสร็จ

document.addEventListener("DOMContentLoaded", () => {

    PokemonCenter.init();

    // ปุ่ม BACK
    document.getElementById("backBtn").addEventListener("click", () => {
        if (PokemonCenter.pokedex.length > 0) {
            PokemonCenter.showScreen("game-screen");
        }
    });

    // ปุ่ม CREATE
    document.getElementById("createBtn").addEventListener("click", () => {
        PokemonCenter.createNewPokemon();
    });

    // ปุ่ม Random Name
    document.getElementById("randomNameBtn").addEventListener("click", async () => {
        try {
            const name = await Pokemon.fetchRandomName();
            document.getElementById("nameInput").value = name;
        } catch {
            document.getElementById("formMessage").textContent = "Could not load name";
            document.getElementById("formMessage").className   = "message error";
        }
    });

    // ปุ่ม + New Pokémon
    document.getElementById("addNewBtn").addEventListener("click", () => {
        PokemonCenter.showScreen("create-screen");
    });

});