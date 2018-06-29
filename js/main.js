var chainnetConfig = {
    mainnet: {
        name: "主网",
        contractAddress: "n1pcbY94karf8gUNbMKbfMwduxKVH1RV7Rr",
        host: "https://mainnet.nebulas.io",
        payhost: "https://pay.nebulas.io/api/mainnet/pay"
    }
}

var chainInfo = chainnetConfig["mainnet"];
var HttpRequest = require("nebulas").HttpRequest;
var Neb = require("nebulas").Neb;
var Unit = require("nebulas").Unit;
var Utils = require("nebulas").Utils;

var myneb = new Neb();
myneb.setRequest(new HttpRequest(chainInfo.host));
var nasApi = myneb.api;


var NebPay = require("nebpay");
var nebPay = new NebPay();
var dappAddress = chainInfo.contractAddress;

if (typeof(webExtensionWallet) === "undefined") {
    alert("请首先安装webExtensionWallet插件");
} 

$(function ($) {
	//弹出登录
	$("#findFriend").on('click', function () {
		$("body").append("<div id='mask'></div>");
		$("#mask").addClass("mask").fadeIn("slow");
		$("#LoginBox").fadeIn("slow");
		$("#scene").css({ display: 'none' });
	});
	
	//文本框不允许为空---按钮触发
	$("#loginbtn").on('click', function () {
		var content = $("#text_content").val();

		if(content == "" || content == undefined || content == null){
			alert("请填写欠条内容！");
			return;
		}

		var hash = sha256_digest(content);
		
		// send transaction
		var to = dappAddress;
		var value = "0";
		var callFunction = "createNew";
		var callArgs = "[\"" + content + "\"]";

		// alert(callArgs);

		nebPay.call(to, value, callFunction, callArgs, {
            listener: createHandle
        });

		$("#LoginBox").fadeOut("fast");
		$("body").append("<div id='spinner'></div>");
		$("#spinner").addClass("spinner").fadeIn("slow");
	});

	//关闭
	$(".close_btn").hover(function () { $(this).css({ color: 'black' }) }, function () { $(this).css({ color: '#999' }) }).on('click', function () {
		$("#LoginBox").fadeOut("fast");
		$("#mask").css({ display: 'none' });
	});
});

function createHandle(resp){
//	alert(JSON.stringify(resp));
 	if( resp.txhash != null) {
 		checkTxStatus(resp.txhash);
 	}
	else {
		alert("发布失败...请重试！");
		$("#spinner").css({ display: 'none' });
 		$("#mask").css({ display: 'none' });
 	}
}

function checkTxStatus(txhash){
	  var timerId = setInterval(function(){
        nasApi.getTransactionReceipt({
            hash:txhash
        }).then(function(receipt){
            if(receipt.status == 1){
                clearInterval(timerId);
                var res = receipt.execute_result;
                console.log("status:"+res);
                alert("发布成功");
                $("#spinner").css({ display: 'none' });
 				$("#mask").css({ display: 'none' });
            }else if(receipt.status == 0){
                clearInterval(timerId);
                console.log("status err:"+receipt.execute_error);
                alert(receipt.execute_error);
                $("#spinner").css({ display: 'none' });
 				$("#mask").css({ display: 'none' });
            }
            
        }).catch(function(err){
            console.log("check error");
        });
    },3*1000);
}

// search user
function startSearch(){
	var to = dappAddress;
	var value = "0";
	var callFunction = "searchUser";
	var callArgs = "";
	nebPay.simulateCall(to, value, callFunction, callArgs, {
            listener: userSearchHandle
        });
}

function addUserItem(plan){
	var user_content = plan.content,
		time = new Date(plan.createTime * 1000).toLocaleString();

	var content = "<div class=\"col-md-12\">" + 
		"<p><font size=\"4\"> " +  user_content + "</font></p>" + 
		"<p><font size=\"4\" > ——在 " +  time + " </font></p>" + 
		"<div class='space'></div>" + 
		"</div>";
	$("#userRow").append(content);
}


function userSearchHandle(resp){
//	alert(JSON.stringify(resp));
	if(resp.execute_err != "") {
		alert("查询失败，请刷新页面！");
		return;
	}
	var result = JSON.parse(resp.result);
	$("#userItem").append("<div class=\"row\" id=\"userRow\">");
	if(result.length == 0){
		$("#userRow").append("您还没有发布任何欠条，请返回首页进行发布~</div>");
	}
	else{
		for(var i in result){
			addUserItem(result[i]);
		}
		$("#userRow").append("</div>");
	}
	
	$("#loading").css({display: 'none'});
}

// public board
function searchPublicPlan(){
	var to = dappAddress,
		value = "0",
		callFunction = "showPublic",
		callArgs = "";
	nebPay.simulateCall(to, value, callFunction, callArgs, {
        listener: publicSearchHandle
    });
}

function addPublicItem(plan){
	var time = new Date(plan.createTime * 1000).toLocaleString(),
	user_content = plan.content;

	var content = "<div class=\"col-md-12\">" + 
		"<p><font size=\"4\"> " +  user_content + "</font></p>" + 
		"<p><font size=\"4\" > ——在 " +  time + " </font></p>" + 
		"<div class='space'></div>" + 
		"</div>";
	$("#publicRow").append(content);
}

function publicSearchHandle(resp){
	if(resp == null || resp.execute_err != "") {
		alert("查询失败...请刷新页面重试！");
		return;
	}
	var result = JSON.parse(resp.result);
	console.log("add public:" + result);
	$("#publicItem").append("<div class='row' id='publicRow'>");
	if(result.length == 0){
		$("#publicRow").append("当前还没有发布任何欠条，请返回首页进行发布~</div>");
	}
	else{
		for(var i in result){
			addPublicItem(result[i]);
		}
		$("#publicRow").append("</div>");
	}
	$("#loading").css({display: 'none'});
};