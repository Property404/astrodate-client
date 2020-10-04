import {createUser} from "./genesis";
import ledger from "./Ledger";
import { Transaction } from "./Transaction";
import tb from "./TransactionBox";
import mono from "./Monolith"
import cw from "./CryptoWrapper";
import carousel from "./ui/Carousel";
import likelist from "./ui/LikeListController";
import messager from "./ui/MessagerController";
import {switchToPanel} from "./ui/utils";
import * as ___ from "./ui/switcher";


function first_time_setup() {
    console.log("First time setup!")
    const signup_panel = document.querySelector("#signup-panel");
    signup_panel.removeAttribute("hidden");

    const partials = ["name", "location"];
    return new Promise((res, rej) =>
    {
        signup_panel.querySelector("button").onclick =
            () =>
            {
                const form_data = {};
                for (const partial of [...partials, "email"]) {
                    form_data[partial] = signup_panel.querySelector("#signup-" + partial).value;
                }
                createUser(form_data["email"]).then( cred=>
                {
                    for (const partial of partials) {
                        const tran = new Transaction(
                            {
                                "type": Transaction.TRANSACTION_TYPE_UPDATE_BIO,
                                "for": partial,
                                "content": form_data[partial],
                                "origin":cred.id
                            });
                        tran.stamp(cred.private_key).then(res=>{
                            tb.sendTransaction(tran)
                        });
                    }
                    signup_panel.setAttribute("hidden", true);
                    res(cred);
                }
                );
            }
    });
}


const rated_users = new Set();
const unrated_users = [];

async function setup()
{
    if(!(ledger.getCredentials().id))
        await first_time_setup();
    console.log("Continuing setup")
    await ledger.initiate();
    mono.initiate();

    switchToPanel("cardstack-panel");
    function removeFromCarousel(id)
    {
        rated_users.add(id);
        unrated_users.splice(unrated_users.indexOf(id), 1);
    }
    carousel.onSwipeLeft = removeFromCarousel;
    carousel.onSwipeRight = id=>{
        if(!id)
        {
            console.log("NULL ID ON SWIPE");
            return;
        }
        console.log("Swiping right");
        if(rated_users.has(id))
            return;
        removeFromCarousel(id);
        const keypair = cw.generateEncryptionKeyPair();
        ledger.saveEphemeralKeypair(id, keypair);
        console.log("Sending LIKE")
        const tran = new Transaction(
            {
                "type": Transaction.TRANSACTION_TYPE_LIKE,
                "for": id,
                "content": keypair.public_key,
                "origin": ledger.getCredentials().id
            });
        tran.stamp(ledger.getCredentials().private_key).then(res => {
            tb.sendTransaction(tran)
            console.log("Sent LIKE")
        });
    }

    mono.callbacks.push( ()=>{
        const users = [];
        for(const user_id in mono.users)
        {
            const user = mono.users[user_id];
            if(user.liked && user.likes_back)
            {
                users.push(user);
            }
        }
        likelist.setList(users);
        messager.update();
    });


    mono.callbacks.push( ()=>
    {
        for(const user_id in mono.users)
        {
            const user = mono.users[user_id];
            if(
                !(rated_users.has(user.id)) &&
                !(unrated_users.includes(user.id))&&
                user.name &&
                !user.liked &&
                user.id != ledger.getCredentials().id
            )
            {
                unrated_users.push(user.id);
                carousel.push(user);
            }

            if(user.liked && unrated_users.includes(user.id))
            {
                // Hack:
                // Remains in DOM, but doesn't do anything when swiping
                removeFromCarousel(user.id);
            }
        }
    });

}

setup()