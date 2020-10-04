import {switchToPanel} from "./utils"

document.querySelector("#goto-messages").onclick = switchToPanel.bind(null, "likelist-panel");
document.querySelector("#goto-swipe").onclick = switchToPanel.bind(null, "cardstack-panel");