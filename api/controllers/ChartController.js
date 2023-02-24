/**
 * ChartController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const { query } = require("express");
const moment = require('moment-timezone');

module.exports = {
    getRecoveryChartData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getRecoveryChartData");
        let query={};

        if(req.body.checked.mClass || req.body.checked.fClass){
            query['priority_class']=[];
        }
        if(req.body.checked.mClass){ query['priority_class'].push("M_CLASS"); }
        if(req.body.checked.fClass){ query['priority_class'].push("F_CLASS"); }

        if(req.body.checked.customerUpdated || req.body.checked.customerNotUpdated){
            query['customer_update']=[];
        }
        if(req.body.checked.customerUpdated){ query['customer_update'].push(true); }
        if(req.body.checked.customerNotUpdated){ query['customer_update'].push(false); }

        if(req.body.checked.loose || req.body.checked.intact){
            query['unitized']=[];
        }
        if(req.body.checked.loose){ query['unitized'].push(false); }
        if(req.body.checked.intact){ query['unitized'].push(true); }

        if(req.body.checked.dap || req.body.checked.rap){
            query['delivery_status']=["",];
        }
        if(req.body.checked.dap){ query['delivery_status'].push('DAP'); }
        if(req.body.checked.rap){ query['delivery_status'].push('RAP'); }

        if(req.body.checked.open || req.body.checked.close){
            query['rcf']=[];
        }
        if(req.body.checked.open){ query['rcf'].push(false);}
        if(req.body.checked.close){ query['rcf'].push(true);}
        // if(req.body.checked.dap){ query['dap']=true; }
        // if(req.body.checked.rap){ query['rap']=true; }
        if(req.body.station.length>0){ query['station']=req.body.station; }
        if(req.body.destination.length>0){ query['dest']=req.body.destination; }
        // if(req.body.agent){ query['agent']=req.body.agent; }
        // if(req.body.delay.length>0){ query['delay']=req.body.delay; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        if(req.body.weight){
            query.weight = {}
            switch(req.body.weight) {
                case 300: 
                    query.weight['<='] = 300;
                    break;
                case 500:
                    query.weight['<='] = 500;
                    break;
                case 501: 
                    query.weight['>'] = 500;
                    break;
                case 0: 
                default:
                    query.weight['>'] = 0;
                    break;
            }
        }

        if(req.body.agent && req.body.agent.length > 0) {
            query.issuer_code = {'in': req.body.selected_agents}
        }
        // query.void_on={};
        query.void_on=0;
        let chartData = await AWBInfo.find({select: ['awb_no', 'station', 'src', 'dest','issuer_name', 'shc',
        'priority_class', 'commodity', 'awb_type', 'amended_awb', 'pieces', 'weight', 'consignee',
        'transhipment', 'on_hand', 'rate_check', 'fdc', 'pre_alert', 'euics', 'cap_a', 'eawb_check',
        'rcf', 'cca', 'unitized', 'delivery_status', 'customer_update'], where: query}).catch(err => console.log( err.message));

        let filteredAWBs = [];
        if(req.body.delay) {
            for(let i = 0; i < chartData.length; i++) {
                let awb_info = chartData[i];
            //chartData = chartData.filter(async function(awb_info) {
                let awbLegs = await AWBLeg.find({
                    where: {awb_no: awb_info.awb_no, from: {'!=': awb_info.station}},
                    sort: 'planned_departure ASC'
                });
                let offloadedAwbLeg = awbLegs.find(awbLeg => awbLeg.status == sails.config.custom.database_model_enums.awb_leg_status.discarded)
                
                if(offloadedAwbLeg) {
                    let skip = true;
                    let nextTakeOff = awbLegs.find(awbLeg => {
                        if(awbLeg.id == offloadedAwbLeg.id) {
                            skip = false;
                            return false;
                        }

                        if(skip == false) {
                            if(awbLeg.status == sails.config.custom.database_model_enums.awb_leg_status.completed && awbLeg.from == offloadedAwbLeg.from) {
                               return true; 
                            }
                        }
                        return false;
                    })
                    
                    if(nextTakeOff) {
                        let offloadedDate = moment.tz(offloadedAwbLeg.void_on, offloadedAwbLeg.from_tz);
                        let takeOffDate = moment.tz(nextTakeOff.planned_departure, nextTakeOff.from_tz);
                        let delay = takeOffDate.diff(offloadedDate, 'days');
                        console.log(`${offloadedAwbLeg.awb_no} offloaded at ${offloadedAwbLeg.from} & delay = ${delay}`)
                        if(req.body.delay.indexOf(delay) != -1) {
                            filteredAWBs.push(awb_info)
                        }
                        //return (req.body.delay.indexOf(delay) != -1);
                    } else {
                        //return false;
                    }
                } else {
                    //return false;
                }
            }
            chartData = filteredAWBs;
        }
        
        res.json(chartData);
        sails.config.log.addOUTlog(req.user.username, "getRecoveryChartData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getCentralOpsRateCheckData: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "getCentralOpsRateCheckData");
        let query={};
        //adding station to query
        if(req.body.station.length>0){ query['station']=req.body.station; }

        // adding start date and end date to query
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        query.opening_status="RATE_CHECK_PENDING";
        query.closing_status="RATE_CHECK_DONE"
        // departure time
        // trigger_time=get all then filter
        
        let chartData = await AWBLegOp.find(query).populate('awb_leg').catch(err => console.log( err.message));
        let awbNos=[];
        for(let i=0;i<chartData.length;i++){
            awbNos.push(chartData[i].awb_no);
        }
        let awbInfos=await AWBInfo.find({select: ['awb_no', 'station', 'src', 'dest','issuer_name', 'shc',
        'priority_class', 'commodity', 'awb_type', 'amended_awb', 'pieces', 'weight', 'consignee',
        'transhipment', 'on_hand', 'rate_check', 'fdc', 'pre_alert', 'euics', 'cap_a', 'eawb_check',
        'rcf', 'cca', 'unitized', 'delivery_status', 'customer_update'], where: {'awb_no':awbNos, void_on:0}}).catch(err => console.log( err.message));
        console.log(chartData);
       
        res.json({chartData,awbInfos});
        sails.config.log.addOUTlog(req.user.username, "getCentralOpsRateCheckData");
        return res;
    
    },

    getCentralOpsPerformanceData: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "getCentralOpsPerformanceData");
        let query={};
        //adding station to query
        if(req.body.station.length>0){ query['station']=req.body.station; }

        // adding start date and end date to query
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        query.opening_status=["RMS_REVIEW","EUICS_PENDING","CAP_A_PENDING","PRE_ALERT_PENDING","E_AWB_CHECK_PENDING"];
        query.closing_status={'!=':""}
        // departure time
        // trigger_time=get all then filter
        
        let chartData = await AWBLegOp.find(query).populate('awb_leg').catch(err => console.log( err.message));
        let awbNos=[];
        for(let i=0;i<chartData.length;i++){
            awbNos.push(chartData[i].awb_no);
        }
        let stationData={};
        let percentageData={};

        let total_euics = 0;
        let total_capa = 0;
        let total_rms_template = 0;
        let total_pre_alert = 0;
        let total_eawb = 0;
        
        let total_euics_before_cutoff = 0;
        let total_capa_before_cutoff = 0;
        let total_rms_template_before_cutoff = 0;
        let total_pre_alert_before_cutoff = 0;
        let total_eawb_before_cutoff = 0;

        for(let i=0;i<req.body.station.length;i++){
            stationData=chartData.filter(legOp=> legOp.station==req.body.station[i]);

            percentageData[req.body.station[i]] = [];
            
            //euics
            let euicsData = stationData.filter(legOp=> legOp.opening_status=="EUICS_PENDING");
            total_euics += euicsData.length;
            let filtered_euics = euicsData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time);
            total_euics_before_cutoff += filtered_euics.length;
            percentageData[req.body.station[i]][0] = ((filtered_euics.length / (euicsData.length == 0 ? 1 : euicsData.length))*100).toFixed(2);

            console.log(req.body.station[i], "total_euics", total_euics, "total_euics_before_cutoff", total_euics_before_cutoff)
            
            //capa
            let capAData = stationData.filter(legOp=> legOp.opening_status=="CAP_A_PENDING");
            total_capa += capAData.length;
            let filtered_capa = capAData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time);
            total_capa_before_cutoff += filtered_capa.length
            percentageData[req.body.station[i]][1] = ((filtered_capa.length / (capAData.length == 0 ? 1 : capAData.length))*100).toFixed(2);
            
            //rms
            let rmsData = stationData.filter(legOp=> legOp.opening_status=="RMS_REVIEW");
            total_rms_template += rmsData.length;
            let filtered_rms = rmsData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time);
            total_rms_template_before_cutoff += filtered_rms.length;
            percentageData[req.body.station[i]][2] = ((filtered_rms.length / (rmsData.length == 0 ? 1 : rmsData.length))*100).toFixed(2);
            
            //pre alert
            let preAlertData = stationData.filter(legOp=> legOp.opening_status=="PRE_ALERT_PENDING");
            total_pre_alert += preAlertData.length;
            let filtered_prealert = preAlertData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time);
            total_pre_alert_before_cutoff += filtered_prealert.length;
            percentageData[req.body.station[i]][3] = ((filtered_prealert.length / (preAlertData.length == 0 ? 1 : preAlertData.length))*100).toFixed(2);
            
            //eawb
            let eAwbData = stationData.filter(legOp=> legOp.opening_status=="E_AWB_CHECK_PENDING");
            total_eawb += eAwbData.length;
            let filtered_eawb = eAwbData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time);
            total_eawb_before_cutoff += filtered_eawb.length;
            percentageData[req.body.station[i]][4] = ((filtered_eawb.length / (eAwbData.length == 0 ? 1 : eAwbData.length))*100).toFixed(2);
        }

        percentageData.total = [];
        
        console.log("total_euics", total_euics, "total_euics_before_cutoff", total_euics_before_cutoff)

        percentageData.total[0] = ((total_euics_before_cutoff / (total_euics == 0 ? 1 : total_euics)) * 100).toFixed(2);
        percentageData.total[1] = ((total_capa_before_cutoff / (total_capa == 0 ? 1 : total_capa)) * 100).toFixed(2);
        percentageData.total[2] = ((total_rms_template_before_cutoff / (total_rms_template == 0 ? 1 : total_rms_template)) * 100).toFixed(2);
        percentageData.total[3] = ((total_pre_alert_before_cutoff / (total_pre_alert == 0 ? 1 : total_pre_alert)) * 100).toFixed(2);
        percentageData.total[4] = ((total_eawb_before_cutoff / (total_eawb == 0 ? 1 : total_eawb)) * 100).toFixed(2);
        
        let awbInfos=await AWBInfo.find({select: ['awb_no', 'station', 'src', 'dest','issuer_name', 'shc',
        'priority_class', 'commodity', 'awb_type', 'amended_awb', 'pieces', 'weight', 'consignee',
        'transhipment', 'on_hand', 'rate_check', 'fdc', 'pre_alert', 'euics', 'cap_a', 'eawb_check',
        'rcf', 'cca', 'unitized', 'delivery_status', 'customer_update'],where: {'awb_no':awbNos, void_on:0}}).catch(err => console.log( err.message));
        console.log(percentageData);
       
        res.json({percentageData,awbInfos});
        sails.config.log.addOUTlog(req.user.username, "getCentralOpsPerformanceData");
        return res;
    },

    getCentralOpsPerformanceMetNotMetData: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "getCentralOpsPerformanceMetNotMetData");
        let query={};
        //adding station to query
        if(req.body.station.length>0){ query['station']=req.body.station; }

        // adding start date and end date to query
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        query.opening_status=["RATE_CHECK_PENDING","FDC_PENDING","PRE_ALERT_PENDING","E_AWB_CHECK_PENDING"];
        query.closing_status={'!=':""}
        // departure time
        // trigger_time=get all then filter
        
        let chartData = await AWBLegOp.find(query).populate('awb_leg').catch(err => console.log( err.message));
        let awbNos=[];
        for(let i=0;i<chartData.length;i++){
            awbNos.push(chartData[i].awb_no);
        }
        let stationData={};
        let percentageData={};
        for(let i=0;i<req.body.station.length;i++){
            stationData=chartData.filter(legOp=> legOp.station==req.body.station[i]);

            percentageData[req.body.station[i]] = [];
            //rateCheck
           let rateCheckData = stationData.filter(legOp=> legOp.opening_status=="RATE_CHECK_PENDING");
           percentageData[req.body.station[i]][0] = rateCheckData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time).length;
           percentageData[req.body.station[i]][1] = rateCheckData.length - percentageData[req.body.station[i]][0];
            //fdc
           let fdcData = stationData.filter(legOp=> legOp.opening_status=="FDC_PENDING");
           percentageData[req.body.station[i]][2] = fdcData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time).length;
           percentageData[req.body.station[i]][3] = fdcData.length - percentageData[req.body.station[i]][2];
            //pre alert
           let preAlertData = stationData.filter(legOp=> legOp.opening_status=="PRE_ALERT_PENDING");
           percentageData[req.body.station[i]][4] = preAlertData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time).length;// / preAlertData.length * 100).toFixed(2);
           percentageData[req.body.station[i]][5] = preAlertData.length - percentageData[req.body.station[i]][4]//(100 - percentageData[req.body.station[i]][4]).toFixed(2);
            //eawb
           let eAwbData = stationData.filter(legOp=> legOp.opening_status=="E_AWB_CHECK_PENDING");
           percentageData[req.body.station[i]][6] = eAwbData.filter(legOps=> legOps.acted_at_time<=legOps.cut_off_time).length;// / eAwbData.length * 100).toFixed(2);
           percentageData[req.body.station[i]][7] = eAwbData.length - percentageData[req.body.station[i]][6]//(100 - percentageData[req.body.station[i]][6]).toFixed(2);
        }
        
        
        let awbInfos=await AWBInfo.find({select: ['awb_no', 'station', 'src', 'dest','issuer_name', 'shc',
        'priority_class', 'commodity', 'awb_type', 'amended_awb', 'pieces', 'weight', 'consignee',
        'transhipment', 'on_hand', 'rate_check', 'fdc', 'pre_alert', 'euics', 'cap_a', 'eawb_check',
        'rcf', 'cca', 'unitized', 'delivery_status', 'customer_update'],where: {'awb_no':awbNos, void_on:0}}).catch(err => console.log( err.message));
        console.log(percentageData);
       
        res.json({percentageData,awbInfos});
        sails.config.log.addOUTlog(req.user.username, "getCentralOpsPerformanceMetNotMetData");
        return res;
    
    },
    getCentralFinCCAData: async function(req, res) {
  
		sails.config.log.addINlog(req.user.username, "getFinChartData");
        let query={};
        let infoQuery={};
        //adding station to query
        if(req.body.station.length>0){ query['station']= {'in': req.body.station}; }

        // adding start date and end date to query
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
            infoQuery.createdAt={};
        }
        
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); 
                                infoQuery.createdAt['>']=new Date(req.body.startDate).getTime();}
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); 
                              infoQuery.createdAt['<']=new Date(req.body.endDate).getTime();}
        
        // if(req.body.cca.length>0){ query.reason=req.body.cca }

        let CCADataNew = await CCARequest.find(query).catch(err => console.log( err.message));
        let CCAData=[];
        if(req.body.cca.length>0){
            CCADataNew.map(request=>{
                for(let i=0;i<request.reason.length;i++){
                    if(req.body.cca.includes(request.reason[i].main_reason)){
                        CCAData.push(request);
                        break;
                    }
                }
            });
        }
        
        let ccaApprovlIds=[];
        for(let i=0;i<CCAData.length;i++){
            if(!ccaApprovlIds.includes(CCAData[i].cca_approval) && CCAData[i].cca_approval){
                ccaApprovlIds.push(CCAData[i].cca_approval);
            } else {
            }
        }

        let approvalQuery = {id: ccaApprovlIds, status: sails.config.custom.cca_approval_status.approved}
        if(req.body.station && req.body.station.length > 0) {
            approvalQuery.station = {in: req.body.station};
        }

        let approvalData = (ccaApprovlIds.length > 0 && ccaApprovlIds.length > 0) ? await CCAApproval.find(approvalQuery).catch(err => console.log( err.message)) : [];

        let awbNos=[];
        for(let i=0;i<approvalData.length;i++){
            awbNos.push(approvalData[i].awb_no);
        }
        let stationData={};
        let chartData={};
        for(let i=0;i<req.body.station.length;i++){
            stationData=approvalData.filter(legOp=> legOp.station==req.body.station[i]);
            
            chartData[req.body.station[i]]=[];
            chartData[req.body.station[i]][0]=stationData.length;
            

            //loop through station data and calcuate all fields
            let ccaFeeEarned=0;
            let origRev=0;
            let revisedRev=0;

            for(let j=0;j<stationData.length;j++){
                ccaFeeEarned = ccaFeeEarned + stationData[j].cca_form_data.revised_prepaid_Amendment_fee_carrier;
                revisedRev = revisedRev + stationData[j].cca_form_data.revised_Prepaid_carrier_total;
                origRev = origRev + stationData[j].cca_form_data.original_prepaid_carrier_total;
            }
            chartData[req.body.station[i]][2]=ccaFeeEarned;
            chartData[req.body.station[i]][3]=origRev;
            chartData[req.body.station[i]][4]=revisedRev;
            chartData[req.body.station[i]][5] = chartData[req.body.station[i]][4] - chartData[req.body.station[i]][3];

            infoQuery['station']=req.body.station[i];
            infoQuery.void_on=0;
            let awbInfoCount = await AWBInfo.count(infoQuery).catch(err => console.log( err.message));
            
            chartData[req.body.station[i]][1]=((chartData[req.body.station[i]][0]/(awbInfoCount == 0 ? 1 : awbInfoCount))*100);
            chartData[req.body.station[i]][6]=awbInfoCount;
        }
        
        let awbInfos=await AWBInfo.find({select: ['awb_no', 'station', 'src', 'dest','issuer_name', 'shc',
        'priority_class', 'commodity', 'awb_type', 'amended_awb', 'pieces', 'weight', 'consignee',
        'transhipment', 'on_hand', 'rate_check', 'fdc', 'pre_alert', 'euics', 'cap_a', 'eawb_check',
        'rcf', 'cca', 'unitized', 'delivery_status', 'customer_update'],where: {'awb_no':awbNos}}).catch(err => console.log( err.message));
        console.log(chartData);

        let ccaInfos = approvalData.map((cca, index) => {
            let cca_date = new Date(cca.createdAt);
            let cca_req = CCAData.find(ccareq => (cca.cca_records_included.indexOf(ccareq.id) != -1))
            return {
                "Sr. No": index + 1,
                "CCA Ref No": cca.cca_no,
                "Station": cca.station,
                "Flight": cca.cca_form_data.flightRecord[0].flightNo0,
                "Flight Date": (new Date(cca.cca_form_data.flightRecord[0].date0)).toLocaleString(),
                "CCA Date": cca_date.toLocaleString(),
                "Awb No": cca.awb_no,
                // "Original Gr Wt": "",
                // "Revised Gr Wt": "",
                // "Original Ch.Wt": "",
                // "Revised Ch.Wt": "",
                // "Original Pub Rate": "",
                // "Revised Pub Rate": "",
                // "Original SFR": "",
                // "Revised SFR": "",
                // "Original Due Carrier chgs": "",
                // "Revised Due Carrier Chgs": "",
                // "CCA Charges": "",
                "Revised revenue": cca.cca_form_data.revised_Prepaid_carrier_total,
                "Original Revenue": cca.cca_form_data.original_prepaid_carrier_total,
                //"SFR Rate Difference": "",
                "Incremental Revenue": cca.cca_form_data.revised_Prepaid_carrier_total - cca.cca_form_data.original_prepaid_carrier_total,
                "Total CCA Fee Earned": cca.cca_form_data.revised_prepaid_Amendment_fee_carrier,
                //"Category": "",
                "Reason": cca_req ? cca_req.reason.reduce((total, curr, index) => {return `${total} ${curr.main_reason}`}, "") : "",
                "Agent": cca.cca_form_data.c_name_address,
                "Month": (cca_date.getMonth() + 1),
                "Year": cca_date.getFullYear(),
                "Serial no": cca.cca_no,
                "text": cca.cca_form_data.Remarks,
                "CCA Approved by": cca.cca_form_data.cargo_Dep_of_Issuing_carrier
            }
        })
       
        res.json({chartData,awbInfos,ccaInfos});
        sails.config.log.addOUTlog(req.user.username, "getFinChartData");
        return res;
    },

    getCentralFinTopData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getCentralFinTopData");
        let query={};
        //adding station to query
        if(req.body.station.length>0){ query['station']=req.body.station; }

        // adding start date and end date to query
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }

        let approvalData = await CCAApproval.find(query).catch(err => console.log( err.message));
        //group by customer
        let groupedData=[]
        for(let i=0;i<approvalData.length;i++){
            let flg=0;
            for(let j=0;j<groupedData.length;j++){
                if(groupedData[j].issuer_name==approvalData[i].issuer_name){
                    groupedData[j].count=groupedData[j].count+1;
                    flg=1;
                    break;
                }
            }
            if(flg==0){
                groupedData.push({issuer_name: approvalData[i].issuer_name, count: 1});
            }
        }
        // now find top customer data
        let topRange=req.body.topRange;
        let topData=[];
        let topIssurs=[]
        while(groupedData.length>0 && topRange>0){
            let max=0;
            let index=-1;
            for(let i=0;i<groupedData.length;i++){
                if(groupedData[i].count>max){
                    max=groupedData[i].count;
                    index=i;
                }
            }
            topIssurs.push(groupedData[index].issuer_name);
            topData.push(groupedData.splice(index,1)[0]);
            
            topRange--;
        }
        //find total awb's for each customer
        let awbInfos=await AWBInfo.find({'issuer_name':topIssurs}).catch(err => console.log( err.message));
        
        for(let i=0;i<topData.length;i++){
            topData[i].awbCount = awbInfos.filter(awbInfo=> awbInfo.issuer_name==topData[i].issuer_name).length
        }
        //form the chart data for top 5 customers
        let topCustomerData=[]
        for(let i=0;i<topData.length;i++){
            let data=[topData[i].issuer_name,topData[i].count, 
                        ((topData[i].count/topData[i].awbCount)*100).toFixed(2),
                        topData[i].awbCount
                    ];
            topCustomerData.push(data);
        }

        
        // get reason data
        // 1. get filtered approval records
        // 2. make a list of all cca_records_included ids from approval records
        // 3. query ccarequest table for all records
        // 4. group by reason
        let ccaReqIds=[];
        approvalData.map(data=>{
            data.cca_records_included.map(reqId=>{
                ccaReqIds.push(reqId);
            });
        });
        let ccaReqRecords=await CCARequest.find({id:[...ccaReqIds]}).catch(err => console.log( err.message));
        // groupedReason[{reason:...,ccaids:[...,...]}]
        let groupedReason=[]
        ccaReqRecords.map(ccaReqRecord=>{
            ccaReqRecord.reason.map(reason=>{
                let flg=0;
                for(let i=0;i<groupedReason.length;i++){
                    if(groupedReason[i].reason==reason.main_reason){
                        flg=1; 
                        if(groupedReason[i].ids.filter(id=> id==ccaReqRecord.cca_approval).length==0){
                            groupedReason[i].ids.push(ccaReqRecord.cca_approval);
                            flg=1;
                            break;
                        }
                    }
                }
                if(flg==0){
                    reason={reason: reason.main_reason, ids:[ccaReqRecord.cca_approval]}
                    groupedReason.push(reason);
                }

            });
        });

        // find top reasons
        // now find top customer data
        topRange=req.body.topRange;
        let topReasonData=[];
        while(groupedReason.length>0 && topRange>0){
            let max=0;
            let index=-1;
            for(let i=0;i<groupedReason.length;i++){
                if(groupedReason[i].ids.length>max){
                    max=groupedReason[i].ids.length;
                    index=i;
                }
            }
            topReasonData.push(groupedReason.splice(index,1)[0]);
            topRange--;
        }
        //forming reason data
        let topReasons=[];
        for(let i=0;i<topReasonData.length;i++){
            let reason=[topReasonData[i].reason, topReasonData[i].ids.length, ((topReasonData[i].ids.length/approvalData.length)*100).toFixed(2)]
            topReasons.push(reason);
        }
        
       
        res.json({topCustomerData, topReasons});
        sails.config.log.addOUTlog(req.user.username, "getCentralFinTopData");
        return res;
    }catch(err){
        console.log(err);}
    
    },

    getOutOfRecoveryData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getOutOfRecoveryData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
        // if(req.body.destination.length>0){ query['dest']=req.body.destination; }
        // if(req.body.agent){ query['agent']=req.body.agent; }
        // if(req.body.delay.length>0){ query['delay']=req.body.delay; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        // query.void_on={};
        // query.void_on=0;
        query.from={};
        query.status="DISCARDED";
        query.from['!=']=['BOM', 'BLR', 'MAA', 'HYD', 'DEL'];
        let legData1 = await AWBLeg.find(query).populate('awb_info').populate('awb_leg_ops').catch(err => console.log( err.message));
        let legData=[]
        if(req.body.destination.length>0){
            legData=legData1.filter(leg=> req.body.destination.includes(leg.awb_info.dest))
        } 
        let response=[];
        legData.map((leg)=>{
            let data={};
            data.Origin=leg.station;
            data.Dest=leg.awb_info.dest
            data.AwbNo=leg.awb_no
            data.CustomerName = leg.awb_info.issuer_name
            data.Product = leg.awb_info.priority_class;
            leg.awb_leg_ops.map((legOp)=>{
                if(data.CurrentEsclalationStatus!="E" && legOp.opening_status=="ESCALATION"){
                    data.CurrentEsclalationStatus="E"
                }
                else if(data.CurrentEsclalationStatus!="E" && legOp.opening_status=="P1_ESCALATION"){
                    data.CurrentEsclalationStatus="P1"
                }
                else if(data.CurrentEsclalationStatus!="P1" && data.CurrentEsclalationStatus!="E" 
                    && legOp.opening_status=="P2_ESCALATION"){
                    data.CurrentEsclalationStatus="P2"
                }
            });
            if(leg.awb_info.rcf){
                leg.awb_leg_ops.map((legOp)=>{
                    if(legOp.closing_status==sails.config.custom.awb_leg_ops_status.rcf_done){
                        // data.Delay = legOp.acted_at_time - leg.void_on
                        var timeleft = leg.void_on - legOp.acted_at_time;
                        data.Delay = Math.ceil((((timeleft / 1000) / 60) / 60) / 24)
                    }
                });
            }
            else{
                // data.Delay=(Date.now() - leg.void_on);
                var timeleft = Date.now() - leg.void_on;
                data.Delay = Math.ceil((((timeleft / 1000) / 60) / 60) / 24)
            }
            // data.Delay = 1;
            // data.CurrentEsclalationStatus="E"
            data.transitPoints=(leg.from+"-"+leg.to)
            if(data.CurrentEsclalationStatus){
                response.push(data);
            }
        });
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getOutOfRecoveryData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getClaimsData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getClaimsData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        // query.void_on={};
        // query.void_on=0;
        // query.from={};
        // query.status="DISCARDED";
        // query.from['!=']=['BOM', 'BLR'];
        let claimData = await AWBClaim.find(query).catch(err => console.log( err.message));
        let awbNos=[];
        claimData.map((claim)=>{
            awbNos.push(claim.awb_no);
        })
        let awbInfos = await AWBInfo.find({awb_no: awbNos}).populate('awb_legs').catch(err => console.log( err.message));
        let response=[];
        claimData.map((claim)=>{
            let data={};
            let awbInfo = awbInfos.filter(awbInfo=>awbInfo.awb_no==claim.awb_no);
            // data.Origin=leg.station;
            // data.Dest=leg.awb_info.dest
            awbInfo[0].awb_legs.map((leg)=>{
                if(leg.from==claim.station){
                    data.FlightNo=leg.flight_no
                    let date=new Date(leg.planned_departure);
                    data.FlightDate=date.getDate()+"/"+date.getMonth()+"/"+date.getFullYear()
                }
            })
            data.AwbNo=claim.awb_no
            data.CustomerName = awbInfo[0].issuer_name
            let date=new Date(claim.createdAt);
            data.ClaimRecievedOn = date.getDate()+"/"+date.getMonth()+"/"+date.getFullYear()
            data.ClaimApproved=0
            data.ClaimuploadedOn=0
            // data.Product = leg.awb_info.priority_class;
            // data.Delay = 1;
            // data.CurrentEsclalationStatus="E"
            // data.transitPoints=(leg.from+"-"+leg.to)
            // if(data.CurrentEsclalationStatus){
                response.push(data);
            // }
        });
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getClaimsData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getEAWBData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getEAWBData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        query.awb_type={};
        query.awb_type['!='] = "";
        let awbInfos = await AWBInfo.find(query).catch(err => console.log( err.message));
       
        let response=[];
        req.body.station.map((station)=>{
            let stationData=awbInfos.filter(info=> info.station==station);
            let eawbs=stationData.filter(info=> info.awb_type=="E_AWB")
            let awbs=stationData.filter(info=> info.awb_type=="AWB")
            let amendedAwbs=stationData.filter(info=> info.amended_awb==true)
            let data={};
            data.Station=station
            data.eAwbCount=eawbs.length
            
            data.AWBCopies=awbs.length
            data['eAWB %']=(eawbs.length/stationData.length)*100
            data["Total awb"]=stationData.length
            data["Amended eAWB"]=amendedAwbs.length
            response.push(data)
        })
        
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getEAWBData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getAllOpsperformance: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getAllOpsperformance");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
        // if(req.body.destination.length>0){ query['dest']=req.body.destination; }
        // if(req.body.agent){ query['agent']=req.body.agent; }
        // if(req.body.delay.length>0){ query['delay']=req.body.delay; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        // query.void_on={};
        // query.void_on=0;
        query.or=[];
        
        // let closing_status=[sails.config.custom.awb_leg_ops_status.rate_check_done,
        //     sails.config.custom.awb_leg_ops_status.fdc_done,
        //     sails.config.custom.awb_leg_ops_status.euics_done,
        //     sails.config.custom.awb_leg_ops_status.cap_a_done,
        //     sails.config.custom.awb_leg_ops_status.e_awb_check_done];

        query.or.push({closing_status:[sails.config.custom.awb_leg_ops_status.rate_check_done,
            sails.config.custom.awb_leg_ops_status.fdc_done,
            sails.config.custom.awb_leg_ops_status.euics_done,
            sails.config.custom.awb_leg_ops_status.cap_a_done,
            sails.config.custom.awb_leg_ops_status.e_awb_check_done]});

        query.or.push({opening_status:[sails.config.custom.awb_leg_ops_status.rms_review]});

        // query.closing_status=[sails.config.custom.awb_leg_ops_status.rate_check_done,
        //     sails.config.custom.awb_leg_ops_status.fdc_done,
        //     sails.config.custom.awb_leg_ops_status.euics_done,
        //     sails.config.custom.awb_leg_ops_status.cap_a_done,
        //     sails.config.custom.awb_leg_ops_status.e_awb_check_done]
        let opData = await AWBLegOp.find(query).catch(err => console.log( err.message));
        let rateCheckData= opData.filter(op=> op.closing_status==sails.config.custom.awb_leg_ops_status.rate_check_done)
        let fdcData= opData.filter(op=> op.closing_status==sails.config.custom.awb_leg_ops_status.fdc_done)
        let euicsData= opData.filter(op=> op.closing_status==sails.config.custom.awb_leg_ops_status.euics_done)
        let capAData= opData.filter(op=> op.closing_status==sails.config.custom.awb_leg_ops_status.cap_a_done)
        let eawbData= opData.filter(op=> op.closing_status==sails.config.custom.awb_leg_ops_status.e_awb_check_done)
        let rmsData= opData.filter(op=> op.opening_status==sails.config.custom.awb_leg_ops_status.rms_review)
        
        // trigger_time
        // acted_at_time
        let data={};
        data[" "]="Total awb";
        data["Rate Check"]=rateCheckData.length;
        data["FDC"]=fdcData.length;
        data["EU-ICS"]=euicsData.length;
        data["CAP-A"]=capAData.length;
        data["E-AWB"]=eawbData.length;
        data["RMS action"]=rmsData.length;
        let response=[];
        response.push(data);

        data={};
        data[" "]="Total time taken";
        
        let time=0;
        if(rateCheckData.length > 0) {
            let timeleft = rateCheckData[0].acted_at_time - rateCheckData[0].trigger_time;
            time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
        }
        time=0;
        rateCheckData.map((op=>{
            let timeleft = op.acted_at_time - op.trigger_time;
            time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
        }));
        if(time>=60){
            data["Rate Check"]=parseInt(time/60)+":"+String(time-(parseInt(time/60)*60));
        }
        else{
            data["Rate Check"]="00:"+time;
        }
        time=0;
        fdcData.map((op=>{
            var timeleft = op.acted_at_time - op.trigger_time;
            time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
        }));
        if(time>=60){
            data["FDC"]=parseInt(time/60)+":"+String(time-(parseInt(time/60)*60));
        }
        else{
            data["FDC"]="00:"+time;
        }
        time=0;
        euicsData.map((op=>{
            var timeleft = op.acted_at_time - op.trigger_time;
            time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
        }));
        if(time>=60){
            data["EU-ICS"]=parseInt(time/60)+ ":" +String(time-(parseInt(time/60)*60));
        }
        else{
            data["EU-ICS"]="00:"+time;
        }
        time=0;
        capAData.map((op=>{
            var timeleft = op.acted_at_time - op.trigger_time;
            time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
        }));
        if(time>=60){
            data["CAP-A"]=parseInt(time/60)+":"+String(time-(parseInt(time/60)*60));
        }
        else{
            data["CAP-A"]="00:"+time;
        }
        time=0;
        eawbData.map((op=>{
            var timeleft = op.acted_at_time - op.trigger_time;
            time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
        }));
        if(time>=60){
            data["E-AWB"]=parseInt(time/60)+":"+String(time-(parseInt(time/60)*60));
        }
        else{
            data["E-AWB"]="00:"+time;
        }
        time=0;
        rmsData.map((op=>{
            if(op.acted_at_time){
                var timeleft = op.acted_at_time - op.trigger_time;
                time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
            }
            
        }));
        if(time>=60){
            data["RMS action"]=parseInt(time/60)+":"+String(time-(parseInt(time/60)*60));
        }
        else{
            data["RMS action"]="00:"+time;
        }
        response.push(data);
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getAllOpsperformance");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getRecoveryProcessPerformanceData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getRecoveryProcessPerformanceData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
        // if(req.body.destination.length>0){ query['dest']=req.body.destination; }
        // if(req.body.agent){ query['agent']=req.body.agent; }
        // if(req.body.delay.length>0){ query['delay']=req.body.delay; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        // query.void_on={};
        // query.void_on=0;
        query.from={};
        query.from['!=']=['BOM', 'BLR', 'HYD', 'MAA', 'DEL'];
        let legData1 = await AWBLeg.find(query).populate('awb_info').populate('awb_leg_ops').catch(err => console.log( err.message));
        let legData=[]
        if(req.body.destination.length>0){
            legData=legData1.filter(leg=> req.body.destination.includes(leg.awb_info.dest))
        } 
        let response=[];
        let recoveryQTime=await OpsDuration.findOne({key: "ready_to_recovery_q_time"}); 
        legData.map((leg)=>{
            
            
            // data.CustomerName = leg.awb_info.issuer_name
            // data.Product = leg.awb_info.priority_class;
           
            let recoveryLegOps=leg.awb_leg_ops.filter(legOp=> legOp.opening_status==sails.config.custom.awb_leg_ops_status.ready_to_recovery)
            if(recoveryLegOps.length>0){
                let data={};
                data.Origin=leg.station;
                data.Dest=leg.awb_info.dest;
                data.AwbNo=leg.awb_no;
                leg.awb_leg_ops.map((legOp)=>{
                    if(data.RecoveryStatus!="E" && legOp.opening_status=="ESCALATION"){
                        data.RecoveryStatus="E"
                    }
                    else if(data.RecoveryStatus!="E" && legOp.opening_status=="P1_ESCALATION"){
                        data.RecoveryStatus="P1"
                    }
                    else if(data.RecoveryStatus!="P1" && data.RecoveryStatus!="E" 
                        && legOp.opening_status=="P2_ESCALATION"){
                        data.RecoveryStatus="P2"
                    }
                });
                for(let i=0;i<recoveryLegOps.length;i++){
                    if(recoveryLegOps[i].trigger_time<Date.now()){
                        let time=new Date(recoveryLegOps[i].trigger_time)
                        data['Date of Queue Recieved'] = time.getDate()+"/"+(time.getMonth()+1)+"/"+time.getFullYear();
                        data.QueueRecievedTime=time.getHours()+":"+time.getMinutes();
                        if(recoveryLegOps[i].acted_at_time){
                            let time=new Date(recoveryLegOps[i].acted_at_time)
                            data.QueueActionTime=time.getHours()+":"+time.getMinutes();
                            
                            var timeleft = recoveryLegOps[i].acted_at_time-recoveryLegOps[i].trigger_time;
                            time=time+Math.ceil((((timeleft / 1000) / 60)))//in minutes
                            if(recoveryQTime.duration>=time){
                                data['Internal SLA Met']=String(recoveryQTime.duration)+" - MET"
                            }
                            else{
                                data['Internal SLA Met']=String(recoveryQTime.duration)+" - NOT MET"
                            }
                            data.QueueStatus="Closed"
                        }
                        else{
                            data.QueueActionTime=" "
                            data['Internal SLA Met']=" "
                            data.QueueStatus="Open"
                        }
                        break;
                    }
                }
                response.push(data);
            }
            
        });
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getRecoveryProcessPerformanceData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getQueueManagementAnalysisData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getQueueManagementAnalysisData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
        // if(req.body.destination.length>0){ query['dest']=req.body.destination; }
        // if(req.body.agent){ query['agent']=req.body.agent; }
        // if(req.body.delay.length>0){ query['delay']=req.body.delay; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        // query.void_on={};
        // query.void_on=0;
        query.opening_status=sails.config.custom.awb_leg_ops_status.rate_check_pending;
        // query.from['!=']=['BOM', 'BLR', 'HYD', 'MAA', 'DEL'];
        let legOpData = await AWBLegOp.find(query).populate('awb_leg').catch(err => console.log( err.message));
        let response=[];
        let uniqueflightlist=[]
        // {"flightNo:flightdepTime": {d30:10, d60:20, d50:49,...}}
        let uniqueflightsData={}
        legOpData.map((legOp)=>{ 
            //calculating time:
            let timeleft = legOp.awb_leg.planned_departure - legOp.createdAt
            let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes

            let key=String(legOp.awb_leg.flight_no) +":"+String(legOp.awb_leg.planned_departure);
            if(uniqueflightsData[key]){
                if(time>=180){
                    if(uniqueflightsData[key]['D180']){
                        uniqueflightsData[key]['D180']=uniqueflightsData[key]['D180']+1;
                    }
                    else{
                        uniqueflightsData[key]['D180']=1
                    }
                }
                else if(time>=150){
                    if(uniqueflightsData[key]['D150']){
                        uniqueflightsData[key]['D150']=uniqueflightsData[key]['D150']+1;
                    }
                    else{
                        uniqueflightsData[key]['D150']=1
                    }
                }
                else if(time>=120){
                    if(uniqueflightsData[key]['D120']){
                        uniqueflightsData[key]['D120']=uniqueflightsData[key]['D120']+1;
                    }
                    else{
                        uniqueflightsData[key]['D120']=1
                    }
                }
                else if(time>=90){
                    if(uniqueflightsData[key]['D90']){
                        uniqueflightsData[key]['D90']=uniqueflightsData[key]['D90']+1;
                    }
                    else{
                        uniqueflightsData[key]['D90']=1
                    }
                }
                else if(time>=60){
                    if(uniqueflightsData[key]['D60']){
                        uniqueflightsData[key]['D60']=uniqueflightsData[key]['D60']+1;
                    }
                    else{
                        uniqueflightsData[key]['D60']=1
                    }
                }
                else if(time>=30){
                    if(uniqueflightsData[key]['D30']){
                        uniqueflightsData[key]['D30']=uniqueflightsData[key]['D30']+1;
                    }
                    else{
                        uniqueflightsData[key]['D30']=1
                    }
                }
            }
            else{
                uniqueflightsData[key]={};
                uniqueflightlist.push(key);
                if(time>=180){
                    if(uniqueflightsData[key]['D180']){
                        uniqueflightsData[key]['D180']=uniqueflightsData[key]['D180']+1;
                    }
                    else{
                        uniqueflightsData[key]['D180']=1
                    }
                }
                else if(time>=150){
                    if(uniqueflightsData[key]['D150']){
                        uniqueflightsData[key]['D150']=uniqueflightsData[key]['D150']+1;
                    }
                    else{
                        uniqueflightsData[key]['D150']=1
                    }
                }
                else if(time>=120){
                    if(uniqueflightsData[key]['D120']){
                        uniqueflightsData[key]['D120']=uniqueflightsData[key]['D120']+1;
                    }
                    else{
                        uniqueflightsData[key]['D120']=1
                    }
                }
                else if(time>=90){
                    if(uniqueflightsData[key]['D90']){
                        uniqueflightsData[key]['D90']=uniqueflightsData[key]['D90']+1;
                    }
                    else{
                        uniqueflightsData[key]['D90']=1
                    }
                }
                else if(time>=60){
                    if(uniqueflightsData[key]['D60']){
                        uniqueflightsData[key]['D60']=uniqueflightsData[key]['D60']+1;
                    }
                    else{
                        uniqueflightsData[key]['D60']=1
                    }
                }
                else if(time>=30){
                    if(uniqueflightsData[key]['D30']){
                        uniqueflightsData[key]['D30']=uniqueflightsData[key]['D30']+1;
                    }
                    else{
                        uniqueflightsData[key]['D30']=1
                    }
                }
            }
        });
        uniqueflightlist.map((flight)=>{
            let data={};
            data.FlightNo=flight.split(":")[0]
            data.FlightTime=new Date(parseInt(flight.split(":")[1])).toLocaleString()
            let totalQs=0;
            if(uniqueflightsData[flight]){
                if(uniqueflightsData[flight]['D30']){
                    data['Internal SLA (30 mins) action']=uniqueflightsData[flight]['D30']
                    totalQs=totalQs+uniqueflightsData[flight]['D30'];
                }
                else{
                    data['Internal SLA (30 mins) action']=0;
                }
                if(uniqueflightsData[flight]['D60']){
                    data['D-60']=uniqueflightsData[flight]['D60']
                    totalQs=totalQs+uniqueflightsData[flight]['D60'];
                }
                else{
                    data['D-60']=0;
                }
                if(uniqueflightsData[flight]['D90']){
                    data['D-90']=uniqueflightsData[flight]['D90']
                    totalQs=totalQs+uniqueflightsData[flight]['D90'];
                }
                else{
                    data['D-90']=0;
                }
                if(uniqueflightsData[flight]['D120']){
                    data['D-120']=uniqueflightsData[flight]['D120']
                    totalQs=totalQs+uniqueflightsData[flight]['D120'];
                }
                else{
                    data['D-120']=0;
                }
                if(uniqueflightsData[flight]['D150']){
                    data['D-150']=uniqueflightsData[flight]['D150']
                    totalQs=totalQs+uniqueflightsData[flight]['D150'];
                }
                else{
                    data['D-150']=0;
                }
                if(uniqueflightsData[flight]['D180']){
                    data['D-180 and above']=uniqueflightsData[flight]['D180']
                    totalQs=totalQs+uniqueflightsData[flight]['D180'];
                }
                else{
                    data['D-180 and above']=0;
                }
                data['Total no of queues']=totalQs;
                data['Queues percentage against total queues %']=String((totalQs/legOpData)*100)+"%";
                data['Queues percentage against total queues % (SLA 30 mins)']=String((data['Internal SLA (30 mins) action']/totalQs) * 100) +"%";
                data['Queues percentage against total queues % (D-60)']=String((data['D-60']) * 100)+"%";
                data['Queues percentage against total queues % (D-90)']=String((data['D-90']/totalQs) * 100)+"%";
                data['Queues percentage against total queues % (D-120)']=String((data['D-120']/totalQs) * 100)+"%";
                data['Queues percentage against total queues % (D-150)']=String((data['D-150']/totalQs) * 100)+"%";
                data['Queues percentage against total queues % (D-180 and above)']=String((data['D-180 and above']/totalQs) * 100)+"%";
            }
            response.push(data);
        })
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getQueueManagementAnalysisData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getLifeCycleOfFlightData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getLifeCycleOfFlightData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
        // if(req.body.destination.length>0){ query['dest']=req.body.destination; }
        // if(req.body.agent){ query['agent']=req.body.agent; }
        // if(req.body.delay.length>0){ query['delay']=req.body.delay; }
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        // query.void_on={};
        // query.void_on=0;
        query.opening_status=sails.config.custom.awb_leg_ops_status.rate_check_pending;
        query.closing_status={};
        query.closing_status["!="]=""

        // query.from['!=']=['BOM', 'BLR', 'HYD', 'MAA', 'DEL'];
        let legOpData = await AWBLegOp.find(query).populate('awb_leg').catch(err => console.log( err.message));
        let response=[];
        // let uniqueflightlist=[]
        // {"flightNo:flightdepTime": {d30:10, d60:20, d50:49,...}}
        // let uniqueflightsData={}
        let rateCheckQTime=await OpsDuration.findOne({key: "ready_to_rate_check_avg_time"}); 
        legOpData.map((legOp)=>{ 
            let data={};
            //calculating time:
            let timeleft = legOp.awb_leg.planned_departure - legOp.createdAt
            let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes

            let key=String(legOp.awb_leg.flight_no) +":"+String(legOp.awb_leg.planned_departure);

            data.FlightNo=legOp.awb_leg.flight_no
            data.FlightTime = new Date(legOp.awb_leg.planned_departure).toLocaleString()

            data.AWBNo=legOp.awb_no
            let slatime=new Date(legOp.acted_at_time);
            let sla=String(slatime.getHours())+":"+String(slatime.getMinutes())

            let slamet = legOp.acted_at_time - legOp.trigger_time
            let slamettime=Math.ceil((((slamet / 1000) / 60)))//in minutes
  
            let qActionTime=new Date(legOp.trigger_time);
            data["Queue action time"]=String(qActionTime.getHours())+":"+String(qActionTime.getMinutes())
            let flag=false;
                if(time>=180 && !flag){
                    data['D-180 and above']=sla;
                    flag=true;
                }
                else{
                    data['D-180 and above']=" ";
                }
                if(time>=150 && !flag){
                    data['D-150']=sla;
                    flag=true;
                }
                else{
                    data['D-150']=" "
                }
                if(time>=120 && !flag){
                    data['D-120']=sla;
                    flag=true;
                }
                else{
                    data['D-120']=" "
                }
                if(time>=90 && !flag){
                    data['D-90']=sla;
                    flag=true;
                }
                else{
                    data['D-90']=" "
                }
                if(time>=60 && !flag){
                    data['D-60']=sla;
                    flag=true;
                }
                else{
                    data['D-60']=" "
                }
                if(slamettime<=rateCheckQTime.duration){
                    
                    data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - MET"
                    
                }
                else{
                    data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - NOT MET"
                }
                if(flag){
                    response.push(data)
                }
            
        });
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getLifeCycleOfFlightData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getDetailedOutputReportBData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getDetailedOutputReportBData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
       
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        

        query.from=req.body.station;
        let legData = await AWBLeg.find(query).populate('awb_leg_ops').populate('awb_info').catch(err => console.log( err.message));
        let response=[];
        legData.map((leg)=>{ 
            let data={};
            data.FlightNo=leg.flight_no
            data.FlightTime=new Date(leg.planned_departure).toLocaleString()
            
            data.AWBNo=leg.awb_no
            if(leg.awb_info.transhipment){
                data.Department="Local Ops"
            }
            else{
                data.Department="Central ops"
            }
            if(req.body.actions.includes("Rate Check")){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.rate_check_done)
                if(ops.length>0){
                    // let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    // let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes
                    let date=new Date(ops[0].acted_at_time)
                    data["Rate Check Date"]=date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear()
                    data["Rate Check Time"]=date.getHours()+":"+date.getMinutes()
                }
                else{
                    data["Rate Check Date"]="NOT DONE";
                    data["Rate Check Time"]="NOT DONE";
                }
            }
            if(req.body.actions.includes("FDC")){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.fdc_done)
                if(ops.length>0){
                    // let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    // let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes
                    let date=new Date(ops[0].acted_at_time)
                    data["FDC Date"]=date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
                    data["FDC Time"]=date.getHours()+":"+date.getMinutes();
                }
                else{
                    data["FDC Date"]="NOT DONE";
                    data["FDC Time"]="NOT DONE";
                }
            }
            if(req.body.actions.includes("EU-ICS")){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.euics_done)
                if(ops.length>0){
                    // let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    // let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes
                    let date=new Date(ops[0].acted_at_time)
                    data["EU-ICS Date"]=date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
                    data["EU-ICS Time"]=date.getHours()+":"+date.getMinutes();
                }
                else{
                    data["EU-ICS Date"]="NOT DONE";
                    data["EU-ICS Time"]="NOT DONE";
                }
            }
            if(req.body.actions.includes("PRE-ALERT")){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.pre_alert_done)
                if(ops.length>0){
                    // let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    // let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes
                    let date=new Date(ops[0].acted_at_time)
                    data["PRE-ALERT Date"]=date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
                    data["PRE-ALERT Time"]=date.getHours()+":"+date.getMinutes();
                }
                else{
                    data["PRE-ALERT Date"]="NOT DONE";
                    data["PRE-ALERT Time"]="NOT DONE";
                }
            }
            if(req.body.actions.includes("CAP-A")){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.cap_a_done)
                if(ops.length>0){
                    // let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    // let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes
                    let date=new Date(ops[0].acted_at_time)
                    data["CAP-A Date"]=date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
                    data["CAP-A Time"]=date.getHours()+":"+date.getMinutes();
                }
                else{
                    data["CAP-A Date"]="NOT DONE";
                    data["CAP-A Time"]="NOT DONE";
                }
            }
            response.push(data);
        });
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getDetailedOutputReportBData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

    getDetailedOutputReportAData: async function(req, res) {
        try{
		sails.config.log.addINlog(req.user.username, "getDetailedOutputReportAData");
        let query={};

        if(req.body.station.length>0){ query['station']=req.body.station; }
       
        if(req.body.startDate || req.body.endDate){
            query.createdAt={};
        }
        if(req.body.startDate){ query.createdAt['>']=new Date(req.body.startDate).getTime(); }
        if(req.body.endDate){ query.createdAt['<']=new Date(req.body.endDate).getTime(); }
        

        query.from=req.body.station;
        let legData = await AWBLeg.find(query).populate('awb_leg_ops').populate('awb_info').catch(err => console.log( err.message));
        let response=[];
        let rateCheckQTime=await OpsDuration.findOne({key: "ready_to_rate_check_avg_time"});
        legData.map((leg)=>{ 
            let data={};
            data.FlightNo=leg.flight_no
            data.FlightTime=new Date(leg.planned_departure).toLocaleString()
            
            data.AWBNo=leg.awb_no
            if(leg.awb_info.transhipment){
                data.Department="Local Ops"
            }
            else{
                data.Department="Central ops"
            }
            if(req.body.actions=="Rate Check"){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.rate_check_done)
                if(ops.length>0){
                    let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes

                    let qActiontimeDate=new Date(ops[0].trigger_time);
                    let qActionTime=String(qActiontimeDate.getHours())+":"+String(qActiontimeDate.getMinutes())

                    data["Queue Action Time"]=qActionTime
                    if(time<=rateCheckQTime.duration){
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - MET"
                    }
                    else{
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - NOT MET"
                    }

                    let DTimeDiff = leg.planned_departure - ops[0].createdAt
                    let DTime=Math.ceil((((DTimeDiff / 1000) / 60)))//in minutes

                    let slatime=new Date(ops[0].acted_at_time);
                    let sla=String(slatime.getHours())+":"+String(slatime.getMinutes())

                    let flag=false;
                    if(DTime>=180 && !flag){
                        data['D-180 and above']=sla;
                        flag=true;
                    }
                    else{
                        data['D-180 and above']=" ";
                    }
                    if(DTime>=150 && !flag){
                        data['D-150']=sla;
                        flag=true;
                    }
                    else{
                        data['D-150']=" "
                    }
                    if(DTime>=120 && !flag){
                        data['D-120']=sla;
                        flag=true;
                    }
                    else{
                        data['D-120']=" "
                    }
                    if(DTime>=90 && !flag){
                        data['D-90']=sla;
                        flag=true;
                    }
                    else{
                        data['D-90']=" "
                    }
                    if(DTime>=60 && !flag){
                        data['D-60']=sla;
                        flag=true;
                    }
                    else{
                        data['D-60']=" "
                    }
                    response.push(data);
                }
            }
            if(req.body.actions=="FDC"){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.fdc_done)
                if(ops.length>0){
                    let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes

                    let qActiontimeDate=new Date(ops[0].trigger_time);
                    let qActionTime=String(qActiontimeDate.getHours())+":"+String(qActiontimeDate.getMinutes())

                    data["Queue Action Time"]=qActionTime
                    if(time<=rateCheckQTime.duration){
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - MET"
                    }
                    else{
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - NOT MET"
                    }
                    response.push(data);
                }
            }
            if(req.body.actions=="EU-ICS"){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.euics_done)
                if(ops.length>0){
                    let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes

                    let qActiontimeDate=new Date(ops[0].trigger_time);
                    let qActionTime=String(qActiontimeDate.getHours())+":"+String(qActiontimeDate.getMinutes())

                    data["Queue Action Time"]=qActionTime
                    if(time<=rateCheckQTime.duration){
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - MET"
                    }
                    else{
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - NOT MET"
                    }
                    response.push(data);
                }
                
            }
            if(req.body.actions=="PRE-ALERT"){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.pre_alert_done)
                if(ops.length>0){
                    let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes

                    let qActiontimeDate=new Date(ops[0].trigger_time);
                    let qActionTime=String(qActiontimeDate.getHours())+":"+String(qActiontimeDate.getMinutes())

                    data["Queue Action Time"]=qActionTime
                    if(time<=rateCheckQTime.duration){
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - MET"
                    }
                    else{
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - NOT MET"
                    }
                    response.push(data);
                }
            }
            if(req.body.actions=="CAP-A"){
                let ops=leg.awb_leg_ops.filter(op=>op.closing_status==sails.config.custom.awb_leg_ops_status.cap_a_done)
                if(ops.length>0){
                    let timeleft = ops[0].acted_at_time - ops[0].trigger_time
                    let time=Math.ceil((((timeleft / 1000) / 60)))//in minutes

                    let qActiontimeDate=new Date(ops[0].trigger_time);
                    let qActionTime=String(qActiontimeDate.getHours())+":"+String(qActiontimeDate.getMinutes())

                    data["Queue Action Time"]=qActionTime
                    if(time<=rateCheckQTime.duration){
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - MET"
                    }
                    else{
                        data['Internal SLA (30 mins) - Met']=String(rateCheckQTime.duration)+" - NOT MET"
                    }
                    response.push(data);
                }
                
            }
        });
        res.json(response);
        sails.config.log.addOUTlog(req.user.username, "getDetailedOutputReportAData");
        return res;
    }catch(err){
        console.log(err);
    }
    
    },

};
