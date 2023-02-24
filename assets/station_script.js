let station_list_table = $('#station_list_table').DataTable({
    //dom: 'lfrtBip',
    /*buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
    ],*/
    serverSide: true,
    ordering: true,
    searching: true,
    deferRender: false,
    pageLength: 10,
    paging: true,
    ajax: {
        url: '/fetchStations',
        type: 'post'
    },
    columns: [
        {
            data:"is_outward",
            searchable: false,
            orderable: false,
            render: function ( data, type, row ) {
                if ( type === 'display' ) {
                    if (data == true)
                        return '<input type="checkbox" class="is_outward" checked>';
                    else
                        return '<input type="checkbox" class="editor-is_outward">';
                }
                return data;
            },
            className: "dt-body-center"
        },
        {
            data: 'iata',
            orderable: true,
            searchable: true
        },
        {
            data: 'name',
            orderable: true,
            searchable: true
        },
        {
            data: 'country',
            orderable: false,
            searchable: false
        },
        {
            data: 'tz',
            searchable: false,
            orderable: false,
        },
        {
            data: 'gmt',
            searchable: false,
            orderable: false,
        },
        {
            data: 'dst',
            searchable: false,
            orderable: false,
        },
    ],
});



$(document).ready(function() {
    var stations = $('#station_list_table').DataTable();
    
    $('#station_list_table tbody').on('click', 'tr', function () {
        var station = stations.row( this ).data();
        showModal(station);
        } );
    } );

function showModal(station){
    if (station) {
        //alert(JSON.stringify(station))
        $('#outwardcargo_airport_list_iata_code_input').val(station.iata);
        $('#outwardcargo_airport_list_city_name_input').val(station.name);
        $('#outwardcargo_airport_list_country_input').val(station.country);
        $('#outwardcargo_airport_list_timezone_input_modal').empty();
        for(let i = 0; i < timeZones.length; i++)
            $('#outwardcargo_airport_list_timezone_input_modal').append("<option" + (station.tz === timeZones[i] ? " selected" : "") + ">" + timeZones[i] + "</option>");
        $('#outwardcargo_airport_list_id').val(station.id);
        if (station.is_outward == 'true') {
            alert(JSON.stringify(station))
            $("#outwardcargo_airport_list_is_outward_destination").prop( "checked", true );
        } else {
            $("#outwardcargo_airport_list_is_outward_destination").prop( "checked", false );
        }
        $('#outwardcargo_airport_list_add_new_city_modal_title').text(' Edit Station');
    } else {
        $('#outwardcargo_airport_list_iata_code_input').val('');
        $('#outwardcargo_airport_list_city_name_input').val('');
        $('#outwardcargo_airport_list_country_input').val('');
        $('#outwardcargo_airport_list_timezone_input').val('');
        $("#outwardcargo_airport_list_is_outward_destination").prop( "checked", false );
        $('#outwardcargo_airport_list_add_new_city_modal_title').text(' Add New Station');
    }
    $('#outwardcargo_airport_list_add_new_city_modal').modal('show');
//alert( 'You clicked on '+JSON.stringify(data)+'\'s row' );
}

function saveAirPort() {
    
    var iatacode = $('#outwardcargo_airport_list_iata_code_input').val();
    var cityname = $('#outwardcargo_airport_list_city_name_input').val();
    var country = $('#outwardcargo_airport_list_country_input').val();
    var tz = $('#outwardcargo_airport_list_timezone_input_modal').val();
    var isoutward = ($('#outwardcargo_airport_list_is_outward_destination').prop("checked")==true)?true:false;
    var id = $("#outwardcargo_airport_list_id").val();
    var isIataCodeNum = /^\d+$/.test(iatacode);
    var isCityNameNum = /^\d+$/.test(cityname);
    var isCountryNum = /^\d+$/.test(country);
    var isTzNum = /^\d+$/.test(tz);
    $( ".invalid-city" ).remove();
    $( ".invalid-iata" ).remove();
    $( ".invalid-country" ).remove();
    $( ".invalid-tz" ).remove();
    if(iatacode == '' || iatacode == null || iatacode == undefined) {
        $( "#outwardcargo_airport_list_iata_code_input" ).addClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').removeClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').removeClass('is-invalid');
        $( "#outwardcargo_airport_list_iata_code_input" ).after( "<div class='invalid-feedback invalid-iata'>IATA Code cannot be blank</div>");
        $( ".invalid-city" ).remove();
    } else if(cityname == '' || cityname == null || cityname == undefined) {
        $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).addClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').removeClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).after( "<div class='invalid-feedback invalid-city'>City Name cannot be blank</div>" );
        $( ".invalid-iata" ).remove();
    } else if(country == '' || country == null || country == undefined) {
        $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').addClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').removeClass('is-invalid');
        $( "#outwardcargo_airport_list_country_input" ).after( "<div class='invalid-feedback invalid-city'>Country Name cannot be blank</div>" );
        $( ".invalid-tz" ).remove();
    } else if(tz == '' || tz == null || tz == undefined) {
        $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').removeClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').removeClass('is-invalid');
        $( "#outwardcargo_airport_list_timezone_input_modal" ).after( "<div class='invalid-feedback invalid-city'>City Timezone cannot be blank</div>" );
        $( ".invalid-country" ).remove();
    } else if(isIataCodeNum) {
        $( "#outwardcargo_airport_list_iata_code_input" ).addClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').removeClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').removeClass('is-invalid');
        $( "#outwardcargo_airport_list_iata_code_input" ).after( "<div class='invalid-feedback invalid-iata'>IATA Code cannot be Number</div>");
        $( ".invalid-city" ).remove();
    } else if(isCityNameNum) {
        $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).addClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').removeClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).after( "<div class='invalid-feedback invalid-city'>City Name cannot be Number</div>" );
        $( ".invalid-iata" ).remove();
    } else if(isCountryNum) {
        $( "#outwardcargo_airport_list_iata_code_input" ).addClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').addClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').removeClass('is-invalid');
        $( "#outwardcargo_airport_list_iata_code_input" ).after( "<div class='invalid-feedback invalid-iata'>IATA Country cannot be Number</div>");
        $( ".invalid-tz" ).remove();
    } else if(isTzNum) {
        $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
        $('#outwardcargo_airport_list_country_input').removeClass('is-invalid');
        $('#outwardcargo_airport_list_timezone_input_modal').addClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).after( "<div class='invalid-feedback invalid-city'>City Timezone cannot be Number</div>" );
        $( ".invalid-country" ).remove();
    } else {
        $('#outwardcargo_airport_list_id').attr('disabled','disabled');
        $( ".invalid-iata" ).remove();
        $( ".invalid-city" ).remove();
        $( ".invalid-country" ).remove();
        $( ".invalid-tz" ).remove();
        $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_country_input" ).removeClass('is-invalid');
        $( "#outwardcargo_airport_list_timezone_input_modal" ).removeClass('is-invalid');
        getCSRFToken(function(_csrf) {
            $.post("addStation", {
                _csrf: _csrf,
                outwardcargo_airport_list_iata_code_input: iatacode, outwardcargo_airport_list_city_name_input: cityname, 
                outwardcargo_airport_list_country_input: country,
                outwardcargo_airport_list_timezone_input_modal: tz,
                outwardcargo_airport_list_is_outward_destination: isoutward, outwardcargo_airport_list_id: id},function (data) {
                    if(data.error_code) {
                        $('#outwardcargo_airport_list_id').removeAttr("disabled");
                    }
                if (data.error_code == 'ERR_AL_IATA_BLANK'){
                    $( "#outwardcargo_airport_list_iata_code_input" ).addClass('is-invalid');
                    $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_country_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_timezone_input_modal" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_iata_code_input" ).after( "<div class='invalid-feedback invalid-iata'>"+data.error+"</div>");
                    $( ".invalid-city" ).remove();
                } else if (data.error_code == 'ERR_AL_CITY_BLANK') {
                    $( "#outwardcargo_airport_list_city_name_input" ).addClass('is-invalid');
                    $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_country_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_timezone_input_modal" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_city_name_input" ).after( "<div class='invalid-feedback invalid-city'>"+data.error+"</div>" );
                    $( ".invalid-iata" ).remove();
                } else if (data.error_code == 'ERR_AL_COUNTRY_BLANK') {
                    $( "#outwardcargo_airport_list_cuontry_input" ).addClass('is-invalid');
                    $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_timezone_input_modal" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_country_input" ).after( "<div class='invalid-feedback invalid-country'>"+data.error+"</div>" );
                    $( ".invalid-tz" ).remove();
                }  else if (data.error_code == 'ERR_AL_TZ_BLANK') {
                    $( "#outwardcargo_airport_list_timezone_input_modal" ).addClass('is-invalid');
                    $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_country_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
                    $( "#outwardcargo_airport_list_timezone_input_modal" ).after( "<div class='invalid-feedback invalid-city'>"+data.error+"</div>" );
                    $( ".invalid-iata" ).remove();
                }  else if (data.value) {
                    toast({
                        type: 'success',
                        title: 'Airport added successfully'
                    })
                    showFakeLoader('outwardcargo_airport_list_add_new_city_modal','/stations')
                } else if (data.error_code == 'ERR_AL_E_UNIQUE'){
                    toast({
                        type: 'error',
                        title: data.error
                    })
                }
            });
        });
    }	
}
function showConfirm() {
let stationIATA = $('#outwardcargo_airport_list_iata_code_input').val();
console.log(stationIATA);
    swal({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then(function (isConfirm) {
        if (isConfirm.value == true) {
            getCSRFToken(function(_csrf) {
                $.post("/deleteStation", {
                    _csrf: _csrf,
                    outwardcargo_airport_list_IATA_delete: stationIATA
                }, function (data) {
                    if (data.error) {
                        swal({
                            title: 'Error!',
                            text: data.error,
                            imageUrl: '/images/alert_cross.png',
                            background: '#ffffff',
                            imageWidth: 150,
                            imageHeight: 150,
                            confirmButtonText: 'OK'
                        });
                    } else {
                        if (data.result)
                            location.href = '/stations';
                    }
                });
            });
        }
    });
}
function hideModal() {
    $( ".invalid-city" ).remove();
    $( ".invalid-iata" ).remove();
    $( ".invalid-country" ).remove();
    $( ".invalid-tz" ).remove();
    $( "#outwardcargo_airport_list_iata_code_input" ).removeClass('is-invalid');
    $( "#outwardcargo_airport_list_city_name_input" ).removeClass('is-invalid');
    $( "#outwardcargo_airport_list_timezone_input_modal" ).removeClass('is-invalid');
    $('#outwardcargo_airport_list_add_new_city_modal').modal('hide');
}
