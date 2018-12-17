# coding:utf-8
import json
from flask import Flask, send_file, request
from elasticsearch import Elasticsearch
import re
from util import es_search_pattern
import keep_es_informed as kei

app = Flask(__name__)

es = Elasticsearch([{'host':'192.168.3.252','port':9200}])


@app.route('/')
def index():
    return send_file('./static/index.html')


# 查询表数据，第一次加载数据与之后的搜索合在一起，赖皮
@app.route('/data')
def fill_data():
    print(request.args)
    if 'search_str' in request.args and request.args['search_str'] != '':
        data = search(request.args['search_str'])
        return data
    else:
        data = load_all_es_data()
        return data

# 提交到es保存
@app.route('/save', methods=['POST'])
def save_data_to_es():
    if 'json_str' in request.form and request.form['json_str'] != '':
        json_str=request.form['json_str']
        x=json.loads(json_str)
        table_name = x['table_name']
        es.index(index='dw_table',doc_type='awesome_table',id=table_name,body=json_str)
    return json.dumps({"msg":"submitted successfully ^_^"})

# keep es informed 同步mysql与es
@app.route('/keep_es_informed',methods=['GET'])
def keep_es_informed():
    kei.keep_es_informed()
    return json.dumps({"msg":"ok"})

@app.route('/help',methods=['GET','POST'])
def help():
    return send_file('./static/help.html')

@app.route('/del',methods=['POST'])
def del_es_table():
    table_to_del=request.form['table_to_del']
    if es.exists(index='dw_table',doc_type='awesome_table',id=table_to_del):
        es.delete(index='dw_table',doc_type='awesome_table',id=table_to_del)
        return json.dumps({"msg":"deleted successfully ^_^"})
    else:
        return json.dumps({"msg":"it's not in es at all 😑"})

def load_all_es_data():
    query={
        "size":2000
    }
    es_tables = es.search(index='dw_table', doc_type='awesome_table',body=query)
    es_tables = es_tables['hits']['hits']
    r =[]
    for i in es_tables:
        table = i['_source']
        r.append(table)
    return json.dumps(r)


def search(search_str):
    print(search_str)
    query_str = search_str.replace('"',' ').replace('|',' ').replace("'",' ')
    str_en = re.sub(pattern=r"[\u4e00-\u9fa5]+", string=query_str, repl="")
    str_ch = re.sub(pattern=r"[^\u4e00-\u9fa5]+", string=query_str, repl=" ")

    pattern_i = re.compile("'(.*)'")
    pattern_ii = re.compile('"(.*)"')
    must_i = pattern_i.findall(search_str)
    must_ii = pattern_ii.findall(search_str)
    if len(must_i+must_ii) == 0 :
        # search without quotation marks
        body = es_search_pattern.query_body(query_str=query_str, str_ch=str_ch, str_en=str_en)
    else:
        # search with quotation marks, in which non-empty-string contents will be queried by es.term and empty-string es.must_not.wildcard.  details lie in the function

        # split by uncertain number of spaces
        spaces= re.compile('\s+')
        must_str_list = spaces.split((must_i + must_ii)[0].strip(' '))
        body = es_search_pattern.query_body(query_str=query_str, str_ch=str_ch, str_en=str_en, must_str=must_str_list)

    res = es.search(index='dw_table', body=body)
    matched_table_list = []
    for hit in res['hits']['hits']:
        x = hit['_source']
        # del x['v']
        matched_table_list.append(x)

    matched_table_json = json.dumps(matched_table_list)
    return matched_table_json



if __name__ == '__main__':
    app.run('0.0.0.0',debug=True)