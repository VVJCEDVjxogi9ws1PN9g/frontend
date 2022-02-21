let locationModal,minerModal,makeOfferModal;function toast(e,t){M.toast({html:e,classes:t?"red":"map"==_scope.currentTab?"white blue-text text-darken-4":""})}function initRest(){const e=document.querySelectorAll(".tooltipped");M.Tooltip.init(e,{})}function refreshView(){const e=document.querySelectorAll("select");M.FormSelect.init(e,{})}document.addEventListener("DOMContentLoaded",function(){let e=document.querySelectorAll(".tabs");M.Tabs.init(e,{}),e=document.querySelectorAll(".dropdown-trigger"),M.Dropdown.init(e,{constrainWidth:!1}),e=document.querySelectorAll("select"),M.FormSelect.init(e,{}),locationModal=M.Modal.init(document.getElementById("locationModal"),{dismissible:!1}),selectModal=M.Modal.init(document.getElementById("selectModal"),{dismissible:!1}),minerMulModal=M.Modal.init(document.getElementById("minerMulModal"),{dismissible:!1}),minerModal=M.Modal.init(document.getElementById("minerModal"),{dismissible:!1}),makeOfferModal=M.Modal.init(document.getElementById("makeOfferModal"),{dismissible:!1}),e=document.querySelectorAll(".collapsible"),M.Collapsible.init(e,{})});let isOldUser=localStorage.getItem("isOldUser");isOldUser=!(null==isOldUser&&null==isOldUser);let hasMined=localStorage.getItem("hasMined");hasMined=!(null==hasMined&&null==hasMined);let shouldStartMiningTour=localStorage.getItem("shouldStartMiningTour");function startMineTour(){if(hasMined)return;const e=new Shepherd.Tour({defaultStepOptions:{cancelIcon:{enabled:!0},classes:"class-1 class-2",scrollTo:{behavior:"smooth",block:"center"}}});addStep(e,"Make the most of your LAND","To make the most of your LAND you should install a miner on the LAND to earn daily mining reward.",null,!0,!1),addStep(e,"Installing a miner","Click on your LAND on the map to open the Miner Installation popup and install the desired miner.",null,!1,!1),addStep(e,"Choosing the right miner","Each miner has a different price and daily reward. To choose the right miner for your LAND view the Miner Cheatsheet on the 'Guide' Page.",".guide-tab",!1,!1),addStep(e,"Track your LANDs","To view your LANDs and update miners visit the 'Dashboard' page.",".db-tab",!1,!0),e.start()}shouldStartMiningTour&&startMineTour();const tour=new Shepherd.Tour({defaultStepOptions:{cancelIcon:{enabled:!0},classes:"class-1 class-2",scrollTo:{behavior:"smooth",block:"center"}}});function addStep(e,t,o,l,a,n){const i=[];a||n||i.push({action(){return this.back()},classes:"shepherd-button-secondary",text:"Back"}),i.push({action(){return n?(localStorage.setItem(e==tour?"isOldUser":"hasMined",!0),this.cancel()):this.next()},text:a?"Start":n?"End":"Next"}),e.addStep({title:t,text:o,buttons:i,attachTo:{on:"bottom",element:l}})}addStep(tour,"App Tour","Looks like you're new here! Let's take a quick tour.",null,!0,!1),addStep(tour,"Welcome to VMINE","VMINE is the world's first mining metaverse. The goal is to acquire the best LANDs and install the best miners to earn the maximum mining rewards daily.",null,!1,!1),addStep(tour,"Connect Wallet","You need a MATIC wallet to use the app. Popular MATIC wallets are:<br/><ol><li>Metamask</li><li>Trust Wallet</li></ol>","#walletOptsTrigger",!1,!1),addStep(tour,"Finding a Location","You can use the search tool to search a specific location on the map.",".search-button",!1,!1),addStep(tour,"Unclaimed LAND","The square on the map represent unclaimed LAND. These LANDs are available for purchase at base price. Click on a square to buy a LAND.",null,!1,!1),addStep(tour,"Multi Select Mode","You can use the Multi Select tool to select multiple LANDs at once.",".leaflet-draw-draw-rectangle",!1,!1),addStep(tour,"Tour Complete","You have completed the beginner's tutorial. For more details and Cheatsheets go to the 'Guide' page.",".guide-tab",!1,!0),isOldUser||tour.start();