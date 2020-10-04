import mc from "./MessagerController"
import {switchToPanel} from "./utils"
class LikeListController
{
    constructor()
    {
        this.panel  = document.querySelector("#likelist-panel");
        this.list = document.querySelector("#likelist");
        this.template = document.querySelector("#likeentry-template");
    }

    clear()
    {
        this.list.innerHTML="";
    }

    setList(datas)
    {
        this.clear();
        for(const user of datas)
        {
            this.push(user);
        }
    }

    push(data)
    {
        const el = this.template.cloneNode(true);
        el.removeAttribute("hidden");
        el.querySelector(".likeentry-name").textContent = data.name;
        el.id = data.id;
        el.onclick = (event)=>
        {
            mc.setId(data["id"])
            switchToPanel("messager-panel");
        }
        this.list.appendChild(el);
    }
}
const likelist = new LikeListController();
export default likelist;