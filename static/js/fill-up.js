/**
 * Created by zero.gong on 2017/6/15.
 * edited by bowen on 2018/11/12
 */

// 请求数据，并写入table
$.ajax({
    url: "/data",
    dataType: "json",
//    data: {"rnd":Math.random()},
    cache:false,
    type: 'get',
    success: function (data) {
        var table = $('#mytable tbody');
        var trs = ``;
        var may_undefined_cols = ['describe','demand','charge'];
        for (var t in data) {
            for (var i in may_undefined_cols){
                if (data[t][may_undefined_cols[i]] == undefined){
                    data[t][may_undefined_cols[i]] = "";
                }
            }
//            console.log(t)
            var str = ``;
            var outer_tr = `
<tr>
    <td class="table-expandable-arrow-td"> ${parseInt(t)+1} </td>
    <td class="table-expandable-arrow-td">${data[t]['table_name']}</td>
    <td class='editable'>${data[t]['describe']}</td>
    <td class='editable'>${data[t]['demand']}</td>
    <td class='editable'>${data[t]['charge']}</td>
    <td>
        <div class="ckbx-style-13">
            <input type="checkbox" id="chbx-${t}" value="0" name="ckbx-style-13" onclick="checkboxOnclick(this)">
            <label for="chbx-${t}"></label>
        </div>
    </td>
    <td>
        <div>
        <a href='${data[t]['doc_url']}' target="_blank" onclick='return check_doc_url_if_exists(this)'>doc</a>,<a href='http://192.168.20.96/Sql?data=dw.${data[t]['table_name']}' target="_blank">explr</a>    
        </div>
    </td>
</tr>
            `;


            var before_inner_tr= `
            <tr>
                <td colspan="6">
                    <table class="table">
                        <tbody>
                            <tr class='success'>
                                <td style="font-size: 12px;"></td>
                                <td style="font-size: 12px;"></td>
                                <td style="font-size:12px;font-weight:bold;font-style:italic;">describe</td>
                                <td style="font-size:12px;font-weight:bold;font-style:italic;">example</td>
                            </tr>
			`;

			var after_inner_tr=`
                            <tr class="success">
                                <td style="font-size:12px;font-weight:bold;font-style:italic;">note:</td>
                                <td style="font-size:12px;" class="editable" colspan="3">${data[t]['detail_describe']}</td>
                            </tr>
                            <tr class="success">
                                <td style="font-size:12px;font-weight:bold;font-style:italic;">doc_url:</td>
                                <td style="font-size:12px;" class="editable" colspan="3">${data[t]['doc_url']}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
			`;


			var inner_tr=``;
			for (var i in data[t]['detail']) {
                var a=``;
                if (data[t]['detail'][i]['partition']=='partition_col'){
                    a=`
<tr class="warning">
    <td style="font-size: 14px;">${data[t]['detail'][i]['col_name']}</td>
    <td style="font-size: 14px;">${data[t]['detail'][i]['data_type']}</td>
    <td class="editable" style="font-size: 14px;">${data[t]['detail'][i]['describe']}</td>
    <td class="editable" style="font-size: 14px;">${data[t]['detail'][i]['example']}</td>
</tr>
                    `
                }
                else {
                    a=`
<tr>
    <td style="font-size: 14px;">${data[t]['detail'][i]['col_name']}</td>
    <td style="font-size: 14px;">${data[t]['detail'][i]['data_type']}</td>
    <td class="editable" style="font-size: 14px;">${data[t]['detail'][i]['describe']}</td>
    <td class="editable" style="font-size: 14px;">${data[t]['detail'][i]['example']}</td>
</tr>
                    `
                }
//    曾经在内层还加了checkbox，舍去。统一用一个大checkbox调控
//    <td align="right">
//        <div class="ckbx-style-8 ckbx-small">
//            <input type="checkbox" id="ckbx-${t}-${i}" value="0" name="ckbx-square-1">
//            <label for="ckbx-${t}-${i}"></label>
//        </div>
//    </td>

                inner_tr+=a;
            }

            str = outer_tr+before_inner_tr+inner_tr+after_inner_tr;
            trs += str;
        }

        table.append(trs);


        $('#mytable').children('tbody').children('tr').filter(':odd').hide();
        $('#mytable').children('tbody').children('tr').filter(':even').each(function () {
            var element = $(this);
            element.append('<td class="table-expandable-arrow-td" align="center">≡</div></td>');
        });

        $('.table-expandable-arrow-td').click(function () {
            var element = $(this.parentElement);
            element.next('tr').toggle('slow');
        });

//        expand-all
        $('#expand-all').click(function(){
            if (parseInt($('#mytable').children('tbody').children('tr').length)>50*2){
                alert('不可以展开所有表哦');
            }
            else{
                $('#mytable').children('tbody').children('tr').filter(':odd').toggle();
            }

        });


    }

});



//range函数
function range(start, count) {
    return Array.apply(0, Array(count))
        .map(function (element, index) {
            return index + start;
        });
}

//设置单元格tds可以被编辑
function enable_edit(tds) {
    for (i in range(0, tds.length)) {
        tds[i].setAttribute('contenteditable', 'true')
    }
    tds[0].focus();
}

//设置单元格tds不可编辑
function disable_edit(tds) {
    for (i in range(0, tds.length)) {
        tds[i].setAttribute('contenteditable', 'false')
    }
}

//submit_to_es
function submit_to_es(str){
    $.ajax({
        url: "/save",
        dataType: "json",
        cache:false,
        data:{"json_str":str},
        type:'post',
        success: function (data) {
            $('#alert button').text(data['msg'])
            $('#alert').fadeIn();
            $('#alert').fadeOut(1700);
        },
        error:function(){
            alert("Something wrong with update")
        }
        });
}

//
function checkboxOnclick(btn){
    var x=btn.parentNode.parentNode.parentNode;
    if (btn.checked == true){
        enable_edit(x.nextElementSibling.getElementsByClassName('editable'));
        enable_edit(x.getElementsByClassName('editable'))
    }
    else {
        disable_edit(x.nextElementSibling.getElementsByClassName('editable'));
        disable_edit(x.getElementsByClassName('editable'));

// 反向拼接成json
        var final_object={};

        var detail=[];
        var inner_head=['col_name','data_type','describe','example']
        m = x.nextElementSibling.getElementsByTagName('tbody')[0].children
        for (i in range(0,m.length-2)){
        if (i>0){
            var n={};
            for(j in range(0,4)){
                n[inner_head[j]] = m[i].children[j].textContent;
            }
            if (m[i].className == 'warning'){
                n['partition']='partition_col';
            }
            else{n['partition']='null'}
            detail.push(n);
        }
        }

        final_object['detail_describe']=m[m.length-2].children[1].textContent
        final_object['doc_url']=m[m.length-1].children[1].textContent

//
        var outer_head=['','table_name','describe','demand','charge']
        s = x.children
        for (i in range(0,s.length-3)){
        if (i>0){
            final_object[outer_head[i]] = s[i].textContent
        }
        }

        final_object['detail']=detail
        final_json=JSON.stringify(final_object)
        submit_to_es(final_json)
    }
}


// 方法是：复制前一个字符（单引号 或者 双引号），然后将光标移至引号内（前移一个字符）。
// 要复制前一个字符，必须用keyup。因为输入过程是在keydown时，若用keydown，则 $('#search_yeah').val()还提取不到值
$("#search_input").keyup(function(event){
　　if(event.keyCode == 222){
        var pos = getCursortPosition(event.target);
        var last_char = lastChar(pos)
        $('#search_input').val($("#search_input").val()+last_char);
        setCaretPosition(event.target, pos)
　　}
});


function getCursortPosition(ctrl) {
    var CaretPos = 0;   // IE Support
    if (document.selection) {
        ctrl.focus();
        var Sel = document.selection.createRange();
        Sel.moveStart ('character', -ctrl.value.length);
        CaretPos = Sel.text.length;
    }
    // Firefox support
    else if (ctrl.selectionStart || ctrl.selectionStart == '0')
        CaretPos = ctrl.selectionStart;
    return (CaretPos);
}


function setCaretPosition(ctrl, pos){
    if(ctrl.setSelectionRange)
    {
        ctrl.focus();
        ctrl.setSelectionRange(pos,pos);
    }
    else if (ctrl.createTextRange) {
        var range = ctrl.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
}


function lastChar(pos){
    var x=document.getElementById('search_input')
    var selection = x.value.substring(pos-1,pos)
    return selection
}


function check_doc_url_if_exists(btn) {
    var x=btn.parentNode.parentNode.parentNode;
    var m = x.nextElementSibling.getElementsByTagName('tbody')[0].children
    if (m[m.length-1].children[1].textContent == "undefined") {
        alert('doc_url does not exist');
        return false
    }
}