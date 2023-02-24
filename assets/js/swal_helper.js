function errorSwal(title, text) {
	swal({
		title: title,
		text: text,
		imageUrl: '/images/alert_cross.png',
		background: '#fff',
		imageWidth: 150,
		imageHeight: 150,
		confirmButtonText: 'OK'
	});
}
function checkinvoice(){
	$("#inwardcargo_invoice_search_invoiceno_input").addClass('is-invalid');
	$( "#inwardcargo_consignees_list_fullname_input" ).after( "<div class='invalid-feedback invalid-fullname'>Name Cannot be blank</div>");
}

/*function getCSRFToken(callback) {
	if(#{sails.config.security.csrf}) {
		$.get( "/csrfToken", function( data ) {
			if(data && data._csrf) {
				callback(data._csrf);
			} else {
				errorSwal('Error', 'Please login again');
				callback(null);
			}
		});
	} else {
		callback(null);
	}
}*/

//	getCSRFToken(function(_csrf) {