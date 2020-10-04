export function switchToPanel(panel_name)
{
    const panels = document.querySelectorAll(".panel");
    for(const panel of panels)
    {
        panel.setAttribute("hidden", true)
    }
    const active_panel = document.getElementById(panel_name);
    active_panel.removeAttribute("hidden");
}