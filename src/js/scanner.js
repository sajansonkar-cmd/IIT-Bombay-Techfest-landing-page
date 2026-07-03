const TRACKS = {
  neural: {
    title: "Neural Pass",
    copy: "Strong fit for AI labs, cognitive systems workshops, and agentic product showcases.",
    baseScore: 84
  },
  mecha: {
    title: "Mecha Pass",
    copy: "Strong fit for robotics arenas, hardware builds, sensor systems, and autonomous challenges.",
    baseScore: 81
  },
  holo: {
    title: "Holo Pass",
    copy: "Strong fit for XR studios, holographic interfaces, spatial systems, and immersive demos.",
    baseScore: 79
  }
};

const MODE_BONUS = {
  explorer: 2,
  builder: 8,
  researcher: 6
};

function getFormValue(form, name) {
  const field = form.elements[name];

  if (!field) {
    return "";
  }

  return field.value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function initCompatibilityScanner() {
  const form = document.querySelector("#compatibility-form");
  const scoreNode = document.querySelector("#compatibility-score");
  const titleNode = document.querySelector("#compatibility-title");
  const copyNode = document.querySelector("#compatibility-copy");
  const teamOutput = document.querySelector("#team-output");
  const productCards = [...document.querySelectorAll("[data-product]")];

  if (!form || !scoreNode || !titleNode || !copyNode || !teamOutput) {
    return;
  }

  function render() {
    const track = getFormValue(form, "track") || "neural";
    const mode = getFormValue(form, "mode") || "explorer";
    const teamSize = Number(getFormValue(form, "teamSize") || 1);
    const hasHardware = Boolean(form.elements.hardware?.checked);
    const profile = TRACKS[track] || TRACKS.neural;

    const teamBonus = teamSize >= 3 && teamSize <= 5 ? 4 : 1;
    const hardwareBonus = track === "mecha" && hasHardware ? 7 : hasHardware ? 2 : 0;
    const score = clamp(profile.baseScore + MODE_BONUS[mode] + teamBonus + hardwareBonus, 62, 98);

    teamOutput.value = String(teamSize);
    scoreNode.textContent = `${score}%`;
    titleNode.textContent = profile.title;
    copyNode.textContent = profile.copy;

    productCards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.product === track);
    });
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();
}
