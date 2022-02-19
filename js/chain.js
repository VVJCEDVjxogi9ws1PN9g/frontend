const RPC_URL="https://speedy-nodes-nyc.moralis.io/b5ff4012083d66a83fad1e18/polygon/mumbai",CHAIN_ID=80001;function loadWeb3(t){window.web3=new Web3(new Web3.providers.HttpProvider(RPC_URL)),window.ethereum&&(window.ethSupported=!0);const n=getLastConnection();1==n?t.connectWeb3():0==n&&t.connectWC()}function setLastConnection(t){localStorage.setItem("LCT",t)}function getLastConnection(){return localStorage.getItem("LCT")}function loadContract(){const t=window.web3,n=bundle.contracts.Land,e=n.networks[CHAIN_ID],a=new t.eth.Contract(n.abi,e.address),o=bundle.contracts.BTC,c=o.networks[CHAIN_ID],s=new t.eth.Contract(o.abi,c.address),r=bundle.contracts.LTC,d=r.networks[CHAIN_ID],i=new t.eth.Contract(r.abi,d.address),l=bundle.contracts.ETC,u=l.networks[CHAIN_ID],w=new t.eth.Contract(l.abi,u.address);window.contracts={land:{contract:a,address:e.address},btc:{contract:s,address:c.address},ltc:{contract:i,address:d.address},etc:{contract:w,address:u.address}}}function toEth(t){return"string"!=typeof t&&(t=t.toString()),window.web3.utils.fromWei(toFixed2(t))}function toWei(t){return"string"!=typeof t&&(t=t.toString()),window.web3.utils.toWei(t)}function toFixed2(t){var n;Math.abs(t)<1?(n=parseInt(t.toString().split("e-")[1]))&&(t*=Math.pow(10,n-1),t="0."+new Array(n).join("0")+t.toString().substring(2)):(n=parseInt(t.toString().split("+")[1]))>20&&(n-=20,t/=Math.pow(10,n),t+=new Array(n+1).join("0"));return t}function getShortAccount(t){return`${t.substr(0,4)}...${t.substr(t.length-4,4)}`}function formatBalance(t){return`${Number(toEth(t)).toFixed(3)} MATIC`}function loadBalance(t,n){null!=t.account?window.web3.eth.getBalance(t.account.address.full).then(e=>{e=parseInt(e),t.account.balance={wei:e,formatted:formatBalance(e)},t.$apply(),n||setLoadBalanceTimeout(t)}).catch(e=>{n||setLoadBalanceTimeout(t)}):n||setLoadBalanceTimeout(t)}function setLoadBalanceTimeout(t){setTimeout(()=>{loadBalance(t,!1)},2e4)}async function getMyLands(t){let n=await window.contracts.land.contract.methods.getMyLands(t.account.address.full).call();n=n.filter(t=>t>0),t.account.lands=n;let e=await window.contracts.land.contract.methods.getMyLandStatuses(t.account.address.full).call();e=e.filter(t=>t>0),t.dbLands=[];for(let a=0;a<n.length;a++)t.dbLands.push({id:n[a],status:e[a]});t.$apply()}window.usingInjected=!1;const REQUEST_POINT_GROUP_SPACE=2e3;async function getStatus2(t){const n={};for(i=0;i<t.length;i+=4){const e=t[i+2],a=Math.floor(e/REQUEST_POINT_GROUP_SPACE);n.hasOwnProperty(a)?n[a].push(t[i],t[i+1],t[i+2],t[i+3]):n[a]=[t[i],t[i+1],t[i+2],t[i+3]]}let e={};for(let t in n){const a=await getStatus4(n[t]);e={...e,...a}}return e}async function getStatus4(t){let n,e;for(i=0;i<t.length;i+=4){const a=t[i+2];0==i?(n=a,e=a):(a<n&&(n=a),a>e&&(e=a))}const a=await window.contracts.land.contract.methods.getStatus(n,e).call(),o={};for(let t=0;t<a.length;t++)o[n+t]=a[t];return o}const REQUEST_POINT_LIMIT=1e4;async function getStatus(t){let n,e;for(i=0;i<t.length;i+=4){const a=t[i+2];0==i?(n=a,e=a):(a<n&&(n=a),a>e&&(e=a))}const a=[],o=e;let c=e-n;for(;c>0;){let t=n,s=e;c>REQUEST_POINT_LIMIT&&(s=(t=(e=n+REQUEST_POINT_LIMIT-1)+1)+REQUEST_POINT_LIMIT-1)>o&&(s=o),(await window.contracts.land.contract.methods.getStatus(n,e).call()).forEach(t=>a.push(t)),c-=e-n+1,n=t,e=s}return a}function performTrx(t,n,e,a,o){if(t.account.balance.wei<a)return void toast("Insufficient Balance",!0);const c={to:n,from:t.account.address.full,value:window.web3.utils.toHex(a),data:e};let s;s=window.usingInjected?window.ethereum.request({method:"eth_sendTransaction",params:[c]}):window.connector.sendTransaction(c),t.toggleLoader(),s.then(n=>{setTimeout(()=>{checkTrx(t,n,o)},TRX_CHECK_DELAY)}).catch(n=>{toast(n.message,!0),t.toggleLoader(),t.$apply()})}const TRX_CHECK_DELAY=2e3;function checkTrx(t,n,e){window.web3.eth.getTransactionReceipt(n,(a,o)=>{if(a)return t.toggleLoader(),void toast(a,!0);null!=o?(t.toggleLoader(),o.status?(loadBalance(t,!0),t.onTrxResult(e)):toast("Transaction Failed",!0)):setTimeout(()=>{checkTrx(t,n,e)},TRX_CHECK_DELAY)})}const LAND_BASE_PRICES=["0.1","0.2","0.3"];async function mintLand(t){const n=(await window.contracts.land.contract.methods.mintLand(t.sl.id)).encodeABI();performTrx(t,window.contracts.land.address,n,window.web3.utils.toWei(LAND_BASE_PRICES[getRating(t.sl.id)-1]),"mintLand")}async function mintMultiple(t,n){const e=(await window.contracts.land.contract.methods.mintMultiple(n)).encodeABI(),a=n.length*LAND_BASE_PRICES[getRating(n[0])-1];performTrx(t,window.contracts.land.address,e,window.web3.utils.toWei(""+a),"mintMultiple")}const MINER_PRICES={2:"1.99",3:"2.99",4:"3.99",5:"4.99",6:"5.99",7:"6.99",8:"7.99",9:"8.99",10:"9.99"};async function installMiner(t,n){const e=(await window.contracts.land.contract.methods.updateStatus(t.sl.id,n)).encodeABI();performTrx(t,window.contracts.land.address,e,window.web3.utils.toWei(MINER_PRICES[n]),"installMiner")}async function updateMultiple(t,n,e){const a=(await window.contracts.land.contract.methods.updateMultiple(n,e)).encodeABI(),o=n.length*MINER_PRICES[e];performTrx(t,window.contracts.land.address,a,window.web3.utils.toWei(""+o),"updateMultiple")}function getLocationNames(t){const n=new XMLHttpRequest;n.onreadystatechange=(()=>{n.readyState==XMLHttpRequest.DONE&&200==n.status&&(t.landDetails={...JSON.parse(n.responseText),...t.landDetails},t.$apply())}),n.open("GET",`http://vmine.xyz/locations/${t.account.address.full}`,!0),n.send()}async function getOffers(t){const n=[],e=await window.contracts.land.contract.methods.getOffers(t.account.address.full,"0").call(),a=[];e.forEach(t=>{0!=t[0]&&(n.push(t[5]),a.push({id:t[0],tokenId:t[5],amt:t[6],amtFormatted:toEth(t[6])+" MATIC"}))}),t.offersMade=a;const o=await window.contracts.land.contract.methods.getOffers(t.account.address.full,"1").call(),c=[];o.forEach(t=>{0!=t[0]&&c.push({id:t[0],tokenId:t[5],amt:t[6],amtFormatted:toEth(t[6])+" MATIC"})}),t.offersRcvd=c,n.length>0&&postRequest("http://vmine.xyz/select-locations/",{ids:n},(n,e)=>{n||(t.landDetails={...JSON.parse(e),...t.landDetails},t.$apply())})}async function makeOffer(t,n,e){const a=(await window.contracts.land.contract.methods.makeOffer(n)).encodeABI();performTrx(t,window.contracts.land.address,a,toWei(e),"makeOffer")}async function cancelOffer(t,n){const e=(await window.contracts.land.contract.methods.cancelOffer(n)).encodeABI();performTrx(t,window.contracts.land.address,e,"0","cancelOffer")}async function acceptOffer(t,n){const e=(await window.contracts.land.contract.methods.acceptOffer(n)).encodeABI();performTrx(t,window.contracts.land.address,e,"0","acceptOffer")}async function loadRewardsData(t,n){let e="";n>=2&&n<=4?e="etc":n>=5&&n<=7?e="ltc":n>=8&&n<=10&&(e="btc");const a=await window.contracts[e].contract.methods.rewardData(t.account.address.full,n).call();t.dbRewards[n-2].claimed=toEth(a[0]),t.dbRewards[n-2].pending=toEth(a[1]),t.$apply()}async function claimReward(t,n){let e="";n>=2&&n<=4?e="etc":n>=5&&n<=7?e="ltc":n>=8&&n<=10&&(e="btc");const a=(await window.contracts[e].contract.methods.claimReward(n)).encodeABI();performTrx(t,window.contracts[e].address,a,0,"claimReward")}function postRequest(t,n,e){const a=new XMLHttpRequest;a.open("POST",t),a.setRequestHeader("Content-Type","application/json"),a.send(JSON.stringify(n)),a.onreadystatechange=(()=>{a.readyState==XMLHttpRequest.DONE&&200==a.status&&e(null,a.responseText)})}function getRequest(t,n){const e=new XMLHttpRequest;e.onreadystatechange=(()=>{e.readyState==XMLHttpRequest.DONE&&(200==e.status?n(null,JSON.parse(e.responseText)):n(`ERROR ${e.status}`,null))}),e.open("GET",t,!0),e.send()}const RATING_BREAKPOINTS=[207974,516027,1015195];function getRatingIndex(t){return t<=RATING_BREAKPOINTS[0]?0:t<=RATING_BREAKPOINTS[1]?1:2}function getRating(t){return t<=RATING_BREAKPOINTS[0]?3:t<=RATING_BREAKPOINTS[1]?2:1}function getSelectNames(t,n){postRequest("http://vmine.xyz/select-locations/",{ids:n},(n,e)=>{n||(t.landDetails={...JSON.parse(e),...t.landDetails},t.$apply())})}