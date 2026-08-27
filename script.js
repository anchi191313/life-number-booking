const LINE_BOOKING_URL = "https://lin.ee/PBp9leg";

const plans = {
  personal: { name: "完整個人解盤", price: "NT$980", duration: "約50分鐘" },
  topic: { name: "主題深度解盤", price: "NT$1,480", duration: "約75分鐘" },
};

const params = new URLSearchParams(window.location.search);
const planKey = plans[params.get("plan")] ? params.get("plan") : "personal";
const plan = plans[planKey];

const formStep = document.querySelector("#formStep");
const confirmStep = document.querySelector("#confirmStep");
const lineStep = document.querySelector("#lineStep");
const form = document.querySelector("#bookingForm");
const formError = document.querySelector("#formError");
const preview = document.querySelector("#linePreview");
const copyStatus = document.querySelector("#copyStatus");

document.querySelector("#selectedPlan").textContent = `${plan.name}｜${plan.price}｜${plan.duration}`;
document.querySelector("#lineButton").href = LINE_BOOKING_URL;

function values() {
  return {
    name: document.querySelector("#name").value.trim(),
    birthDate: document.querySelector("#birthDate").value,
    contact: document.querySelector("#contact").value.trim(),
    reason: document.querySelector("#reason").value.trim(),
    note: document.querySelector("#note").value.trim(),
  };
}

function setStep(step) {
  formStep.hidden = step !== 1;
  confirmStep.hidden = step !== 2;
  lineStep.hidden = step !== 3;
  document.querySelectorAll("[data-step-dot]").forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.stepDot) === step);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderConfirmation(data) {
  const items = [
    ["解盤方案", `${plan.name}｜${plan.price}｜${plan.duration}`],
    ["姓名／暱稱", data.name],
    ["出生年月日", data.birthDate],
    ["聯絡方式", data.contact],
    ["最想弄懂的事", data.reason],
    ["補充事項", data.note || "無"],
  ];
  const container = document.querySelector("#confirmation");
  container.replaceChildren(...items.map(([label, value]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    return row;
  }));
}

function buildLineMessage(data) {
  return [
    "【生命靈數完整解盤預約】",
    `方案：${plan.name}｜${plan.price}｜${plan.duration}`,
    `姓名／暱稱：${data.name}`,
    `西元出生年月日：${data.birthDate}`,
    `聯絡方式：${data.contact}`,
    "",
    "這次最想弄懂的一件事：",
    data.reason,
    "",
    "想先讓解盤師知道的事：",
    data.note || "無",
    "",
    "我已填完預約資料，想請您協助確認可預約的日期與時間，謝謝。",
  ].join("\n");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";
  if (!form.checkValidity()) {
    formError.textContent = "請完成所有必填欄位，並確認內容格式。";
    form.reportValidity();
    return;
  }
  const data = values();
  if (data.reason.length < 10) {
    formError.textContent = "「最想弄懂的一件事」請至少填寫 10 個字。";
    return;
  }
  renderConfirmation(data);
  setStep(2);
});

document.querySelector("#editButton").addEventListener("click", () => setStep(1));
document.querySelector("#generateButton").addEventListener("click", () => {
  preview.value = buildLineMessage(values());
  copyStatus.textContent = "";
  setStep(3);
});
document.querySelector("#backToConfirmButton").addEventListener("click", () => setStep(2));

document.querySelector("#copyButton").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(preview.value);
    copyStatus.textContent = "已複製預約內容，可以前往 LINE 貼上。";
  } catch {
    preview.focus();
    preview.select();
    const copied = document.execCommand("copy");
    copyStatus.textContent = copied
      ? "已複製預約內容，可以前往 LINE 貼上。"
      : "瀏覽器無法自動複製，請長按預約文字後選擇複製。";
  }
});
