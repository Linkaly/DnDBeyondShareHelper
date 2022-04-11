// ==UserScript==
// @name         DnDBeyond Campage Share Helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  automatically kicks characters that are inside a campagne for too long
// @author       Linkally
// @match        https://www.dndbeyond.com/campaigns/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dndbeyond.com
// @updateURL    https://github.com/Linkaly/DnDBeyondShareHelper/raw/main/DnDBeyondShareHelper.user.js
// @downloadURL  https://github.com/Linkaly/DnDBeyondShareHelper/raw/main/DnDBeyondShareHelper.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function updateShareButton(btn, shareEnabled){
        if(shareEnabled){
            btn.innerHTML = "Disable Sharing";
        }
        else{
            btn.innerHTML = "Enable Sharing";
        }
    }

    var intervall = null;

    function updateSharing(btn, shareEnabled, campagneID){
        updateShareButton(btn, shareEnabled);

        if(shareEnabled)
        {
            var chars = GM_getValue(campagneID + "chars", {});
            var cards = document.getElementsByClassName("ddb-campaigns-character-card");
            var curChars = [];
            for (let i = 0; i < cards.length; i++) {
                curChars.push(cards[i].getElementsByClassName("ddb-campaigns-character-card-header-upper-character-info-secondary")[1].innerHTML);
            }
            var toDelete = null;

            for (let i = 0; i < curChars.length && toDelete === null; i++) {
                let idx = curChars[i];
                if (idx == "Unassigned")
                {
                    toDelete = i;
                }
                else if (chars[idx] && chars[idx]+10*60*1000 < Date.now())
                {
                    toDelete = i;
                }
                else
                {
                    for (let j = i+1; j < curChars.length && toDelete === null; j++)
                    {
                        if (curChars[i] == curChars[j])
                        {
                            toDelete = j;
                        }
                    }
                }

                if (toDelete === null && !(chars[idx]))
                {
                    chars[idx] = Date.now();
                }
            }

            for (var k in chars)
            {
                if(!(curChars.includes(k)))
                {
                    delete chars[k];
                }
            }

            GM_setValue(campagneID + "chars", chars);

            if (toDelete !== null) {
                cards[toDelete].getElementsByClassName("ddb-campaigns-character-card-footer-links-item-more-remove")[0].click();
                delete chars[curChars[toDelete]];
                setTimeout(() => {
                    GM_setValue(campagneID + "chars", chars);
                    document.getElementsByClassName("ajax-post")[0].click();
                }, 2000);
            }

            intervall = setTimeout(() => {
                GM_setValue(campagneID + "chars", chars);
                location.reload();
            }, 60*1000);
        }
        else if(intervall)
        {
            clearTimeout(intervall);
        }
    }

    var campagneID = window.location.href.split("/")[4];
    var referenceNode = document.getElementsByClassName("page-title")[0]
    if(referenceNode && campagneID)
    {
        var campagneShareEnabled = GM_getValue(campagneID, false);

        var el = document.createElement("button");
        updateSharing(el, campagneShareEnabled == true, campagneID)
        el.onclick = function(){
            if(campagneShareEnabled == true) {campagneShareEnabled = false;}
            else {campagneShareEnabled = true;}
            GM_setValue(campagneID, campagneShareEnabled);
            updateSharing(el, campagneShareEnabled, campagneID)
            return false;
        };
        el.setAttribute("class", "button");
        insertAfter(referenceNode, el);
    }
})();