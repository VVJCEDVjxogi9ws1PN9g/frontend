let locationModal, minerModal, makeOfferModal;

document.addEventListener('DOMContentLoaded', function () {
	// var elems = document.querySelectorAll('.sidenav');
	// M.Sidenav.init(elems, {});

	let elems = document.querySelectorAll('.tabs');
	M.Tabs.init(elems, {
		// swippable: true
	});

	elems = document.querySelectorAll('.dropdown-trigger');
  M.Dropdown.init(elems, { constrainWidth: false });

	elems = document.querySelectorAll('select');
  M.FormSelect.init(elems, {});

	locationModal = M.Modal.init(document.getElementById('locationModal'), {
		dismissible: false
	});

	selectModal = M.Modal.init(document.getElementById('selectModal'), {
		dismissible: false
	});

	minerMulModal = M.Modal.init(document.getElementById('minerMulModal'), {
		dismissible: false
	});

	minerModal = M.Modal.init(document.getElementById('minerModal'), {
		dismissible: false
	});

	makeOfferModal = M.Modal.init(document.getElementById('makeOfferModal'), {
		dismissible: false
	});

	elems = document.querySelectorAll('.collapsible');
  M.Collapsible.init(elems, {});
});

function toast(msg, isErrorMsg) {
	M.toast({ html: msg, classes: isErrorMsg ? 'red' : _scope.currentTab == 'map' ? 'white blue-text text-darken-4' : ''});
}

function initRest() {
	const elems = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(elems, {});
}

function refreshView() {
	const elems = document.querySelectorAll('select');
  M.FormSelect.init(elems, {});
}