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

    <!-- Centered Main Section -->
    <div class="main-section">
      <!-- Title row (kept simple; no progress bar now) -->
      <div class="timer-section">
        <button class="btn customize-btn" @click="goToCustomize">Customize</button>
        <span class="time-text">Diagnosis</span>
      </div>

      <!-- ECG Report Card (this IS the typing box) -->
      <div
        class="typing-box ecg-card"
        tabindex="0"
        @keydown="handleKeyPress"
        ref="card"
      >
        <div class="ecg-inner">
          <div class="ecg-header">
            <div class="ecg-title">DIAGNOSTIC CENTER</div>
            <div class="ecg-subtitle">SAMPLE HOSPITAL</div>
            <div class="ecg-address">118 E. Quirino Ave., Davao City</div>
          </div>

          <div class="ecg-section-title">ELECTROCARDIOGRAPHIC REPORT</div>

          <!-- Row 1 -->
          <div class="ecg-row">
            <div class="ecg-col">
              <span class="label">Name:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.name)" class="cursor"></span>
                <template v-for="(ch, i) in report.name.split('')" :key="'name'+i">
                  <span :class="charClass(offsets.name + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.name + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="ecg-col">
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

          <!-- Row 2 -->
          <div class="ecg-row">
            <div class="ecg-col">
              <span class="label">Age:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.dob)" class="cursor"></span>
                <template v-for="(ch, i) in report.dob.split('')" :key="'dob'+i">
                  <span :class="charClass(offsets.dob + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.dob + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="ecg-col">
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

          <!-- Row 3 -->
          <div class="ecg-row">
            <div class="ecg-col">
              <span class="label">Date:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.date)" class="cursor"></span>
                <template v-for="(ch, i) in report.date.split('')" :key="'date'+i">
                  <span :class="charClass(offsets.date + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.date + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="ecg-col">
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

          <div class="ecg-mid-title">DESCRIPTION OF TRACING</div>

          <!-- Row 4 -->
          <div class="ecg-row">
            <div class="ecg-col">
              <span class="label">Atrial Rate:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.atrialRate)" class="cursor"></span>
                <template v-for="(ch, i) in report.atrialRate.split('')" :key="'atr'+i">
                  <span :class="charClass(offsets.atrialRate + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.atrialRate + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="ecg-col">
              <span class="label">QRS Duration:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.qrsDuration)" class="cursor"></span>
                <template v-for="(ch, i) in report.qrsDuration.split('')" :key="'qrsd'+i">
                  <span :class="charClass(offsets.qrsDuration + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.qrsDuration + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
          </div>

          <!-- Row 5 -->
          <div class="ecg-row">
            <div class="ecg-col">
              <span class="label">Ventricular Rate:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.ventricularRate)" class="cursor"></span>
                <template v-for="(ch, i) in report.ventricularRate.split('')" :key="'vent'+i">
                  <span :class="charClass(offsets.ventricularRate + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.ventricularRate + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="ecg-col">
              <span class="label">QRS Axis:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.qrsAxis)" class="cursor"></span>
                <template v-for="(ch, i) in report.qrsAxis.split('')" :key="'qrsa'+i">
                  <span :class="charClass(offsets.qrsAxis + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.qrsAxis + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
          </div>

          <!-- Row 6 -->
          <div class="ecg-row">
            <div class="ecg-col">
              <span class="label">PPR Interval:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.pprInterval)" class="cursor"></span>
                <template v-for="(ch, i) in report.pprInterval.split('')" :key="'ppr'+i">
                  <span :class="charClass(offsets.pprInterval + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.pprInterval + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
            <div class="ecg-col">
              <span class="label">QT Interval:</span>
              <span class="value">
                <span v-if="cursorAt(offsets.qtInterval)" class="cursor"></span>
                <template v-for="(ch, i) in report.qtInterval.split('')" :key="'qt'+i">
                  <span :class="charClass(offsets.qtInterval + i)">{{ ch }}</span>
                  <span v-if="cursorAt(offsets.qtInterval + i + 1)" class="cursor"></span>
                </template>
              </span>
            </div>
          </div>

          <div class="ecg-mid-title">DIAGNOSIS DESCRIPTION:</div>
          <div class="dx-line">
            - <span class="value no-underline">
              <span v-if="cursorAt(offsets.dx1)" class="cursor"></span>
              <template v-for="(ch, i) in report.dx1.split('')" :key="'dx1'+i">
                <span :class="charClass(offsets.dx1 + i)">{{ ch }}</span>
                <span v-if="cursorAt(offsets.dx1 + i + 1)" class="cursor"></span>
              </template>
            </span>
          </div>
          <div class="dx-line">
            - <span class="value no-underline">
              <span v-if="cursorAt(offsets.dx2)" class="cursor"></span>
              <template v-for="(ch, i) in report.dx2.split('')" :key="'dx2'+i">
                <span :class="charClass(offsets.dx2 + i)">{{ ch }}</span>
                <span v-if="cursorAt(offsets.dx2 + i + 1)" class="cursor"></span>
              </template>
            </span>
          </div>
        </div>
      </div>

      <!-- Action row: Submit button -->
      <div class="submit-row">
        <button class="submit-btn" @click="finishTest">Submit</button>
      </div>

      <!-- Redo -->
      <div class="redo-section">
        <img
          src="@/assets/redo.png"
          alt="Redo"
          class="redo-img"
          tabindex="0"
          ref="redoBtn"
          @click="resetTyping"
          @keydown.enter.prevent="resetTyping"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { getAuth } from "firebase/auth"; // Import Firebase Auth

export default {
  name: "DiagnosisMode",
  data() {
    return {
      username: "", // Initialize username as empty
      typedText: "",
      correct: 0,
      incorrect: 0,

      report: {
        name: "",
        bp: "",
        dob: "",
        drug: "",
        date: "",
        physician: "",
        atrialRate: "",
        qrsDuration: "",
        ventricularRate: "",
        qrsAxis: "",
        pprInterval: "",
        qtInterval: "",
        dx1: "",
        dx2: ""
      },

      offsets: {},
      textToType: ""
    };
  },
  async created() {
    await this.fetchUsername(); // Fetch the username when the component is created
    this.generateRandomReport(); // Generate the random report
  },
  mounted() {
    // Focus the card so typing can start immediately
    this.$refs.card?.focus();
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
    handleKeyPress(e) {
      if (e.key === "Tab") {
        e.preventDefault();
        this.$refs.redoBtn?.focus();
        return;
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
    charClass(globalIndex) {
      if (globalIndex < this.typedText.length) {
        return this.typedText[globalIndex] === this.textToType[globalIndex]
          ? "correct"
          : "incorrect";
      }
      return "pending";
    },
    cursorAt(position) {
      return position === this.typedText.length &&
             this.typedText.length < this.textToType.length;
    },
    resetTyping() {
      this.typedText = "";
      this.correct = 0;
      this.incorrect = 0;
      this.$refs.card?.focus();
    },
    finishTest() {
      // No timer now; we just compute basic stats and route to results
      const wordsTyped = this.typedText.trim().split(/\s+/).filter(Boolean).length || 0;
      const wpm = wordsTyped; // placeholder since there is no elapsed time
      const totalChars = this.typedText.length;
      const accuracy = totalChars > 0 ? Math.round((this.correct / totalChars) * 100) : 0;

      this.$router.push({
        path: "/results",
        query: {
          wpm,
          accuracy,
          time: 0,
          correct: this.correct,
          incorrect: this.incorrect,
          backspaces: 0
        }
      });
    },

    // Navigation
    goToSettings() { this.$router.push("/settings"); },
    goToHome() { this.$router.push("/loggedin"); },
    goToUserPage() { this.$router.push("/user"); },
    goToHighscore() { this.$router.push("/highscore"); },
    goToAbout() { this.$router.push("/aboutns"); },
    goToCustomize() { this.$router.push("/customize"); },

    // Randomization + offsets
    generateRandomReport() {
      const names = [
        "Antonelli, Charles R.", "Rivera, Maria L.", "Lopez, Daniel P.",
        "Santos, Angela V.", "Mendoza, Patrick K."
      ];
      const bps = ["120/80", "138/86", "110/70", "128/82", "142/90"];
      const dobs = ["01/10/1991", "08/22/1988", "05/03/1979", "12/15/1994", "03/30/1985"];
      const drugs = ["Metformin", "Amlodipine", "Atorvastatin", "Warfarin", "Losartan"];
      const dates = ["01/23/2025", "02/14/2025", "11/30/2024", "10/05/2024", "03/01/2025"];
      const physicians = [
        "Dr. Villanueva, Anita", "Dr. Cruz, Ramon", "Dr. Tan, Celina",
        "Dr. Reyes, Victor", "Dr. Navarro, Liza"
      ];
      const atrialRates = ["141 /min", "98 /min", "120 /min", "75 /min", "132 /min"];
      const qrsDurations = ["0.08 sec.", "0.10 sec.", "0.09 sec.", "0.07 sec.", "0.12 sec."];
      const ventricularRates = ["136 /min", "92 /min", "118 /min", "74 /min", "128 /min"];
      const qrsAxes = ["45 sec", "30 sec", "60 sec", "15 sec", "-10 sec"];
      const pprIntervals = ["0.12 sec", "0.16 sec", "0.14 sec", "0.11 sec", "0.20 sec"];
      const qtIntervals = ["0.28 sec", "0.32 sec", "0.30 sec", "0.36 sec", "0.40 sec"];
      const dx1s = [
        "Right atrial enlargement; right ventricular hypertrophy.",
        "Left ventricular hypertrophy; strain pattern.",
        "Sinus tachycardia; possible right atrial enlargement.",
        "First-degree AV block; nonspecific intraventricular delay.",
        "Right bundle branch block; possible RVH."
      ];
      const dx2s = [
        "ST-T wave changes.", "No acute ST-T elevations.", "T-wave inversions anterolateral leads.",
        "Nonspecific ST-T abnormalities.", "Prolonged QT noted."
      ];

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

      this.report = {
        name: pick(names),
        bp: pick(bps),
        dob: pick(dobs),
        drug: pick(drugs),
        date: pick(dates),
        physician: pick(physicians),
        atrialRate: pick(atrialRates),
        qrsDuration: pick(qrsDurations),
        ventricularRate: pick(ventricularRates),
        qrsAxis: pick(qrsAxes),
        pprInterval: pick(pprIntervals),
        qtInterval: pick(qtIntervals),
        dx1: pick(dx1s),
        dx2: pick(dx2s)
      };

      const order = [
        "name","bp","dob","drug","date","physician",
        "atrialRate","qrsDuration","ventricularRate","qrsAxis","pprInterval","qtInterval",
        "dx1","dx2"
      ];

      let cursor = 0;
      const offsets = {};
      let target = "";

      order.forEach((k) => {
        offsets[k] = cursor;
        const val = String(this.report[k]);
        target += val;
        cursor += val.length;
      });

      this.offsets = offsets;
      this.textToType = target;
      this.resetTyping();
    }
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
  box-shadow: none;
}
.logo { font-weight: bold; font-size: 25px; color: #2D539E; }
.right-section { display: flex; align-items: center; gap: 15px; }
.username { font-weight: normal; font-size: 18px; color: #333; }
.progress-circle { width: 30px; height: 30px; background-color: #2D539E; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.progress-number { color: white; font-weight: bold; font-size: 15px; }
.icon-img { height: 30px; width: auto; cursor: pointer; }

/* Main layout */
.main-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 36px;
  margin-top: 50px;
}

/* Title row (no progress bar now) */
.timer-section {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;  
  width: 56%;
  max-width: 820px;
}
.customize-btn { color: white; background: #2D539E; padding: 6px 12px; border-radius: 6px; }
.time-text { font-weight: 500; }

/* ECG Report Card = Typing Box */
.typing-box {
  width: 56%;
  max-width: 820px;
  padding: 24px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0px 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #ddd;
  font-size: 20px;            /* increased by 5px */
  line-height: 1.38;
  outline: none;
  user-select: none;
  text-align: center;         /* center the content */
  cursor: text;
}

.ecg-card { border: 1px solid #dfe5ef; }
.ecg-inner { border: 2px solid #e6ebf3; border-radius: 12px; padding: 18px 24px; }

.ecg-header { margin-bottom: 6px; }
.ecg-title { font-weight: 600; letter-spacing: 0.03em; color: #111827; }
.ecg-subtitle { font-weight: 600; color: #111827; }
.ecg-address { color: #6b7280; font-size: 0.8em; }

.ecg-section-title { margin: 10px 0 8px; font-weight: 600; color: #111827; }
.ecg-mid-title { margin: 12px 0 8px; font-weight: 600; color: #111827; }

.ecg-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 24px;
  align-items: baseline;
  margin: 3px 0;
}

.ecg-col .label {
  color: #111827; /* black text (fixed) */
  margin-right: 6px;
}

.value {
  color: #9aa3af;               /* gray typing text */
  text-decoration: underline;   /* underlined like in the photo */
  text-underline-offset: 3px;
}
.value.no-underline { text-decoration: none; }

.dx-line { color: #6b7280; margin: 2px 0; }

/* Typing feedback */
.pending { color: #9aa3af; }
.correct { color: #000000; }
.incorrect { color: #d93025; }

/* Cursor */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background-color: #111827;
  margin: 0 1px;
  animation: blink 1s infinite;
  vertical-align: bottom;
}
@keyframes blink { 0%{opacity:1;} 50%{opacity:0;} 100%{opacity:1;} }

/* Submit button row */
.submit-row {
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
.submit-btn:hover { filter: brightness(0.97); }
.submit-btn:active { transform: translateY(1px); }

/* Redo Button */
.redo-section { margin-top: 5px; }
.redo-img { height: 34px; cursor: pointer; outline: none; }
.redo-img:focus { outline: 3px solid #2D539E; border-radius: 6px; }
</style>
