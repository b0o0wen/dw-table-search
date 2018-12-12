function search(){
// ajax请求默认是页面局部刷新（不然怎么是ajax呢），所以无法在后端通过判断提交信息来重定向到 /help 所以在前端先判断。
var search_input = $('#search_input').val()
if (search_input =='#help'){
    var f = document.getElementById('search_form');
    f.action = '/help';
    f.submit();
}
else {
$.ajax({
    url: "/data",
    dataType: "json",
    cache:false,
    data: $('#search_form').serialize(),
    type: 'get',
    success: function (data) {

//        删除原有数据重新写
        $("#mytable tbody>tr").remove();

//        以下与fill-up.js中success function一样，不过不必再 expand-all
        var table = $('#mytable tbody');
        var trs = ``;
        var may_undefined_cols = ['describe','demand','charge'];
        for (var t in data) {
            for (var i in may_undefined_cols){
                if (data[t][may_undefined_cols[i]] == undefined){
                    data[t][may_undefined_cols[i]] = "";
                }
            }
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

                inner_tr+=a;
            }

            str = outer_tr+before_inner_tr+inner_tr+after_inner_tr;
            trs += str;
        }

        table.append(trs);


        $('#mytable').children('tbody').children('tr').filter(':odd').hide();
        $('#mytable').children('tbody').children('tr').filter(':even').each(function () {
            var element = $(this);
            element.append('<td class="table-expandable-arrow-td">≡</div></td>');
        });

        $('.table-expandable-arrow-td').click(function () {
            var element = $(this.parentElement);
            element.next('tr').toggle('slow');
        });



    },
    error:function(){
        alert("Something wrong with search")
    }
});
}
}


function keep_es_informed(){
var l = Ladda.create(document.querySelector('.progress-demo button'));
	l.start();
$("#mytable tbody>tr").remove();
$.ajax({
    url: "/keep_es_informed",
    dataType: "json",
    cache:false,
    type: 'get',
    success: function (data) {
        search();
//        search 是异步的，所以下边 stop等0.5 秒
        setTimeout( function(){l.stop();}, 0.5 * 1000 );
    }
});
}