import {createUser} from "./genesis";
import ledger from "./Ledger";


function first_time_setup()
{
    console.log("First time setup!")
    const signup_panel = document.querySelector("#signup-panel");
    signup_panel.removeAttribute("hidden");

    return new Promise((res, rej)=>{
        signup_panel.querySelector("button").onclick = 
        ()=>
        {
            const form_data = {};
            for(const partial of ["name", "location", "email"])
            {
                form_data[partial] = signup_panel.querySelector("#signup-"+partial).value;
            }

            signup_panel

        }
    });
}

async function setup()
{
    if(!(ledger.getCredentials().id))
        await first_time_setup();
    console.log("Continuing setup")
}

setup()