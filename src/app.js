import {createUser} from "./genesis";
import ledger from "./Ledger";
import { Transaction } from "./Transaction";
import tb from "./TransactionBox";
import mono from "./Monolith"


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

async function setup()
{
    if(!(ledger.getCredentials().id))
        await first_time_setup();
    console.log("Continuing setup")
    await ledger.initiate();
    mono.initiate();

}

setup()