<template>
  <div class="app-container">
    <!-- Top Bar (unchanged) -->
    <header class="top-bar">
      <div class="left-section">
        <span class="logo" @click="goToHome" style="cursor: pointer;">NurseScripts</span>
      </div>
      <div class="right-section">
        <!-- Username (tooltip: User page) -->
        <a
          @click="$router.push('/user')"
          style="cursor: pointer; text-decoration: none; color: inherit;"
          title="User page"
          aria-label="User page"
        >
          {{ username }}
        </a>

        <!-- Progress Circle -->
        <div class="progress-circle" title="Progress" aria-label="Progress">
          <span class="progress-number">5</span>
        </div>

        <!-- Icons with hover tooltips -->
        <img
          src="@/assets/settings.png"
          alt="Settings"
          class="icon-img"
          title="Settings"
          aria-label="Settings"
          @click="goToSettings"
        />
        <img
          src="@/assets/highscore.png"
          alt="Highscore"
          class="icon-img"
          title="Highscore"
          aria-label="Highscore"
          @click="goToHighscore"
        />
        <img
          src="@/assets/about.png"
          alt="About"
          class="icon-img"
          title="About"
          aria-label="About"
          @click="goToAbout"
        />
      </div>
    </header>

    <!-- Main -->
    <div class="main-section">
      <!-- DO NOT CHANGE (Customize + progress) -->
      <div class="timer-section">
        <button class="btn customize-btn" @click="goToCustomize">Customize</button>
        <span class="time-text">Doctor’s Prescription</span>
      </div>

      <!-- Prescription Sheet (this IS the typing area) -->
      <div class="typing-box rx-card" tabindex="0" @keydown="handleKeyPress">
        <div class="rx-inner">
          <!-- Header -->
          <div class="hdr">
            <div class="hosp">SAMPLE HOSPITAL</div>
            <div class="addr">118 E. Quirino Ave., Davao City</div>
          </div>
          <div class="divider"></div>

          <!-- Info rows -->
          <div class="row two">
            <div class="cell">
              <span class="label">Name:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.name)" class="cursor"></span>
                <template v-for="(ch, i) in report.name.split('')" :key="'n'+i">
                  <span :class="charClass(offsets.name + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.name + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="cell">
              <span class="label">Blood Pressure:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.bp)" class="cursor"></span>
                <template v-for="(ch, i) in report.bp.split('')" :key="'bp'+i">
                  <span :class="charClass(offsets.bp + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.bp + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
          </div>

          <div class="row two">
            <div class="cell">
              <span class="label">Age:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.age)" class="cursor"></span>
                <template v-for="(ch, i) in report.age.split('')" :key="'age'+i">
                  <span :class="charClass(offsets.age + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.age + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="cell">
              <span class="label">Drugs being taken:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.drug)" class="cursor"></span>
                <template v-for="(ch, i) in report.drug.split('')" :key="'drug'+i">
                  <span :class="charClass(offsets.drug + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.drug + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
          </div>

          <div class="row two">
            <div class="cell">
              <span class="label">Date:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.date)" class="cursor"></span>
                <template v-for="(ch, i) in report.date.split('')" :key="'date'+i">
                  <span :class="charClass(offsets.date + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.date + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="cell">

              <span class="label">Physician:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.physician)" class="cursor"></span>
                <template v-for="(ch, i) in report.physician.split('')" :key="'phys'+i">
                  <span :class="charClass(offsets.physician + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.physician + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
          </div>


          <!-- Rx + Medications -->
          <div class="rx-center">
            <div class="rx-section">
              <img class="rx-icon" src="@/assets/rx.png" alt="Rx" />
              <!-- bring text a bit below the Rx icon -->
              <div class="rx-list">
                <div class="rx-line">
                  <template v-for="(ch, i) in report.med1.split('')" :key="'m1'+i">
                    <span :class="charClass(offsets.med1 + i)">{{ ch }}</span>
                    <span v-if="cursorAt(offsets.med1 + i + 1)" class="cursor"></span>
                  </template>
                </div>
                <div class="rx-line">
                  <template v-for="(ch, i) in report.med2.split('')" :key="'m2'+i">
                    <span :class="charClass(offsets.med2 + i)">{{ ch }}</span>
                    <span v-if="cursorAt(offsets.med2 + i + 1)" class="cursor"></span>
                  </template>
                </div>
                <div class="rx-line">
                  <template v-for="(ch, i) in report.med3.split('')" :key="'m3'+i">
                    <span :class="charClass(offsets.med3 + i)">{{ ch }}</span>
                    <span v-if="cursorAt(offsets.med3 + i + 1)" class="cursor"></span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom actions -->
      <div class="actions">
        <button class="submit-btn" @click="finishTest">Submit</button>
      </div>
    </div>
  </div>
</template>

<script>
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { getAuth } from "firebase/auth"; // Import Firebase Auth

export default {
  name: "DoctorsPrescrip",
  data() {
    return {
      username: "", // Initialize username as empty
      // Typing state
      timeLeft: 30,
      totalTime: 30,
      typedText: "",
      typingStarted: false,
      timer: null,
      correct: 0,
      incorrect: 0,

      // Dynamic values (grey/typable)
      report: {
        name: "",
        bp: "",
        age: "",
        drug: "",
        date: "",
        room: "",
        physician: "",
        med1: "",
        med2: "",
        med3: ""
      },

      // Positions inside one long target string
      offsets: {},
      textToType: ""
    };
  },
  computed: {
    progressWidth() {
      return (this.timeLeft / this.totalTime) * 100;
    }
  },
  async created() {
    await this.fetchUsername(); // Fetch the username when the component is created
    this.generateRandomPrescription(); // Generate the random prescription
  },
  methods: {
    async fetchUsername() {
      try {
        const auth = getAuth(); // Get Firebase Auth instance
        const userId = auth.currentUser?.uid; // Get the current user's ID
        if (!userId) {
          console.error("User is not logged in.");
          return;
        }

        const db = getFirestore(); // Get Firestore instance
        const userDocRef = doc(db, `users/${userId}`); // Reference to the user's document
        const userDoc = await getDoc(userDocRef); // Fetch the document

        if (userDoc.exists()) {
          this.username = userDoc.data().name; // Set the username from Firestore
        } else {
          console.error("No user document found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    },
    // ===== Typing core =====
    handleKeyPress(e) {
      // Allow typing anywhere on the sheet
      if (e.key === "Tab") { e.preventDefault(); return; }

      if (!this.typingStarted) {
        this.typingStarted = true;
        this.startTimer();
      }

      if (e.key === "Backspace") {
        if (this.typedText.length > 0) this.typedText = this.typedText.slice(0, -1);
        return;
      }

      if (e.key.length === 1) {
        this.typedText += e.key;
        const i = this.typedText.length - 1;
        if (this.textToType[i] === e.key) this.correct++;
        else this.incorrect++;
      }
    },
    charClass(idx) {
      if (idx < this.typedText.length) {
        return this.typedText[idx] === this.textToType[idx] ? "correct" : "incorrect";
      }
      return "pending";
    },
    cursorAt(pos) {
      return this.timeLeft > 0 && pos === this.typedText.length && this.typedText.length < this.textToType.length;
    },
    startTimer() {
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) this.timeLeft--;
        else { clearInterval(this.timer); }
      }, 1000);
    },
    finishTest() {
      clearInterval(this.timer);
      const elapsed = this.totalTime;
      const wordsTyped = (this.typedText.trim().split(/\s+/).filter(Boolean).length) || 0;
      const wpm = Math.round((wordsTyped / (elapsed || 1)) * 60);
      const totalChars = this.typedText.length;
      const accuracy = totalChars ? Math.round((this.correct / totalChars) * 100) : 0;

      this.$router.push({
        path: "/results",
        query: {
          wpm, accuracy, time: elapsed,
          correct: this.correct, incorrect: this.incorrect, backspaces: 0
        }
      });
    },

    // ===== Nav =====
    goToSettings() { this.$router.push("/settings"); },
    goToHome() { this.$router.push("/loggedin"); },
    goToHighscore() { this.$router.push("/highscore"); },
    goToAbout() { this.$router.push("/aboutns"); },
    goToCustomize() { this.$router.push("/customize"); },

    // ===== Data randomization =====
    generateRandomPrescription() {
      const names = ["Arandia, Sienna R.", "Rivera, Maria L.", "Antonelli, Charles R.", "Lopez, Daniel P."];
      const bps   = ["120/80", "128/82", "138/86", "110/70"];
      const ages  = ["01/10/1991", "08/22/1988", "05/03/1979", "12/15/1994"];
      const drugs = ["Metformin", "Amlodipine", "Atorvastatin", "Telmisartan"];
      const dates = ["01/23/2025", "10/05/2024", "02/14/2025", "03/01/2025"];
      const rooms = ["03", "11", "07", "19"];
      const doctors = ["Dr. Villanueva, Anita", "Dr. Cruz, Ramon", "Dr. Tan, Celina", "Dr. Reyes, Victor"];

      const meds = [
        "Tab. Metformin 500 mg - 1 tab PO BID with meals",
        "Tab. Telmisartan 40 mg - 1 tab PO OD in the morning",
        "Tab. Atorvastatin 10 mg - 1 tab PO HS",
        "Tab. Amlodipine 5 mg - 1 tab PO OD",
        "Tab. Hydrochlorothiazide 25 mg - 1 tab PO OD AM"
      ];

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const medPick = () => pick(meds);

      // choose three distinct meds
      let m1 = medPick(), m2 = medPick(), m3 = medPick();
      const ensureDistinct = new Set([m1]);
      while (ensureDistinct.has(m2)) m2 = medPick();
      ensureDistinct.add(m2);
      while (ensureDistinct.has(m3)) m3 = medPick();

      this.report = {
        name: pick(names),
        bp: pick(bps),
        age: pick(ages),
        drug: pick(drugs),
        date: pick(dates),
        room: pick(rooms),
        physician: pick(doctors),
        med1: m1,
        med2: m2,
        med3: m3
      };

      // Concatenate all typable values into one target (no visual separators)
      const order = ["name","bp","age","drug","date","room","physician","med1","med2","med3"];
      let cursor = 0; const offsets = {}; let target = "";
      order.forEach(k => {
        offsets[k] = cursor;
        const val = String(this.report[k]);
        target += val;
        cursor += val.length;
      });
      this.offsets = offsets;
      this.textToType = target;

      // reset typing session
      clearInterval(this.timer);
      this.timeLeft = this.totalTime;
      this.typedText = "";
      this.correct = 0;
      this.incorrect = 0;
      this.typingStarted = false;
    }
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
};
</script>

<style scoped>
.app-container {
  font-family: "Inter", sans-serif;
  background: #f9fbfd;
  color: #333;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Top bar (unchanged) */
.top-bar {
  width: 100%;
  height: 80px;
  background: #f9fbfd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 215px;
}
.logo { font-weight: bold; font-size: 25px; color: #2D539E; }
.right-section { display: flex; align-items: center; gap: 15px; }
.progress-circle { width: 30px; height: 30px; background:#2D539E; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.progress-number { color:#fff; font-weight:bold; font-size:15px; }
.icon-img { height:30px; width:auto; cursor:pointer; }

/* Main layout */
.main-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  margin-top: 50px;
}

/* Timer section (kept) */
.timer-section { display:flex; align-items:center; gap:15px; width:70%; }
.customize-btn { color:#fff; background:#2D539E; padding:6px 12px; }
.time-text { font-weight:500; }
.progress-bar { flex:1; height:8px; background:#ddd; border-radius:4px; overflow:hidden; }
.progress { height:100%; background:#2D539E; transition: width .3s linear; }

/* Prescription Sheet (typing area) */
.typing-box {
  width: 56%;
  max-width: 820px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #d9dee9;
  box-shadow: 0 2px 10px rgba(0,0,0,.05);
  padding: 22px;
  outline: none;
  user-select: none;
  text-align: center;
  cursor: text;
  font-size: 20px;      /* +5 as requested earlier */
  line-height: 1.4;
}

.rx-card { border: 1px solid #dfe5ef; }
.rx-inner { border: 2px solid #e6ebf3; border-radius: 12px; padding: 18px 22px; }

.hdr { margin-bottom: 8px; }
.hosp { font-weight:600; color:#111827; }
.addr { color:#6b7280; font-size:.85em; }
.divider { height:1px; background:#cfd6e6; margin:10px 14px 14px; }

.row { margin: 6px 0; }
.row.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
  align-items: baseline;
}
.row.one-right {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.cell .label { color:#111827; margin-right:6px; }
.value {
  color:#9aa3af;                 /* grey typable text */
  text-decoration: underline;
  text-underline-offset: 3px;
}
.pending { color:#9aa3af; }
.correct { color:#000; }
.incorrect { color:#d93025; }

/* Rx block */
.rx-center { display:flex; justify-content:center; margin-top: 50px; }
.rx-section {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: flex-start;       /* top-align image; list handled by margin */
  column-gap: 18px;
}
.rx-icon { width: 50px; height: auto; }
.rx-list {
  margin-top: 10px;              /* <-- pushes the text a bit BELOW the Rx icon */
  color: #9aa3af;
  text-decoration: none;
  text-align: left;
}
.rx-line { margin: 6px 0; }

/* Caret */
.cursor {
  display:inline-block; width:2px; height:1.1em;
  background:#111827; margin:0 1px; animation: blink 1s infinite;
  vertical-align: bottom;
}
@keyframes blink { 0%{opacity:1;} 50%{opacity:0;} 100%{opacity:1;} }

/* Bottom actions */
.actions {
  width: 56%;
  max-width: 820px;
  display: flex;
  justify-content: flex-end;
}
.submit-btn {
  background: #2D539E;
  color: white;
  border: none;
  padding: 8px 22px;
    border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.submit-btn:active { transform: translateY(1px); }
</style>
