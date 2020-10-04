import mono from "../Monolith"
import { Transaction } from "../Transaction";
import ledger from "../Ledger";
import cw from "../CryptoWrapper";
import tb from "../TransactionBox";
class MessagerController
{
    constructor()
    {
        this.panel  = document.querySelector("#messager-panel");
        this.list = document.querySelector("#messages");
        this.template = document.querySelector("#message-template");
        document.querySelector("#send").onclick = ()=>{
            console.log("Time to send message?")
            const text = this.panel.querySelector("input").value;
            if(!text)
            {
                console.log("Nothing to send");
                return;
            }

            const cred = ledger.getCredentials();
            const keypair = ledger.getEphemeralKeypair(this.current_id);
            const public_key = mono.users[this.current_id].ephemeral_key;
            if(!public_key)
            {
                throw new Error("Oh no - public ephemeral key don't exist")
            }
            if(!keypair.public_key)
            {
                throw new Error("Couldn't find keypair")
            }

            const trans = new Transaction({
                "type":Transaction.TRANSACTION_TYPE_MESSAGE,
                "origin":cred.id,
                "for": this.current_id
            });
            const message = cw.encrypt(text, trans.nonce, public_key, keypair.private_key)
            trans.content = message;
            trans.stamp(ledger.getCredentials().private_key).then(()=>
                tb.sendTransaction(trans)
            );
        }
    }

    clear()
    {
        this.list.innerHTML="";
    }

    setId(id)
    {
        console.log("Using ID "+id)
        this.current_id = id;
        console.log("Name "+mono.users[id].name)
        this.update();
    }

    update()
    {
        console.log("Up?")
        if(this.current_id)
            this._setList(mono.users[this.current_id].messages);
    }

    _setList(datas)
    {
        if(!this.current_id)
            return;
        this.clear();
        let messages = datas.sort((a,b)=>a.timestamp>b.timestamp)
        if(messages.length>2)
        {
            if(messages[0].timestamp > messages[1].timestamp)
            {
                messages = messages.reverse();
            }
        }
        for(const message of messages)
        {
            this._push(message);
        }
    }

    _push(data)
    {
        const el = this.template.cloneNode(true);
        el.removeAttribute("hidden");
        el.querySelector(".message-content").innerHTML = data.content;
        if(data.origin == ledger.getCredentials().id)
        {
            el.classList.add("origin");
        }
        this.list.appendChild(el);
    }
}
const messager = new MessagerController();
export default messager;