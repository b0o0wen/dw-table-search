import pymysql
from elasticsearch import Elasticsearch
from util.constant import MYSQL_CONFIG



def keep_es_informed():
    # mysql 中数据
    con = pymysql.connect(**MYSQL_CONFIG)
    cursor = con.cursor()
    sql = '''
    SELECT table_name,GROUP_CONCAT(col separator '@') as columns FROM (
        SELECT table_name, CONCAT_WS('+',convert(column_name USING utf8),convert(column_type USING utf8),convert(`partition` USING utf8)) AS col
        FROM (
            SELECT tbl.tbl_name as table_name,col.column_name, col.type_name AS column_type, 'f' AS `partition`
            FROM DBS db
            INNER JOIN TBLS tbl ON db.db_id = tbl.db_id
            INNER JOIN SDS sds ON tbl.sd_id = sds.sd_id
            INNER JOIN COLUMNS_V2 col ON sds.cd_id = col.cd_id
            WHERE db.name = 'dw'

            UNION ALL

            SELECT tbl.tbl_name as table_name, pt.PKEY_NAME AS column_name, pt.PKEY_TYPE AS column_type, 'partition_col' AS `partition`
            FROM DBS db
            INNER JOIN TBLS tbl ON db.db_id = tbl.db_id
            LEFT JOIN PARTITION_KEYS pt ON tbl.tbl_id = pt.tbl_id
            WHERE db.name = 'dw'
        ) t
        WHERE t.column_name IS NOT NULL
    )s
    group by table_name
    '''
    cursor.execute('SET SESSION group_concat_max_len = 10240')
    cursor.execute(sql)
    content = cursor.fetchall()
    cursor.close()
    con.close()

    from_mysql = {}
    for i in content:
        table_name = i[0]
        x = {}
        for j in i[1].split('@'):
            col_name = j.split('+')[0]
            data_type = j.split('+')[1]
            partition = j.split('+')[2]
            x[col_name] = {
                "data_type": data_type,
                "partition": partition
            }
        from_mysql[table_name] = x

    # es中数据
    es = Elasticsearch([{'host': '192.168.3.252', 'port': 9200}])
    query = {
        "size": 2000
    }
    es_tables = es.search(index='dw_table', doc_type='awesome_table', body=query)
    es_tables = es_tables['hits']['hits']

    from_es = {}
    for i in es_tables:
        table = i['_source']
        if 'detail' in table.keys():
            x = {}
            for j in table["detail"]:
                x[j['col_name']] = {
                    "describe": j.get('describe', ''),
                    "partition": j.get('partition', ''),
                    "example": j.get('example', ''),
                    "data_type": j.get('data_type', '')
                }
            from_es[table['table_name']] = x
        # why some tables do not have detail ?

    # 之后用到的渲染模板，暂时先不用jinja2
    def format_render(cols, table_name='', charge='', describe='', demand='', detail_describe=''):
        detail = []
        for col_name in cols.keys():
            x = {
                "describe": cols[col_name].get('describe', ''),
                "partition": cols[col_name]['partition'],
                "col_name": col_name,
                "example": cols[col_name].get('example', ''),
                "data_type": cols[col_name]['data_type']
            }
            detail.append(x)
        body = {
            "table_name": table_name,
            "charge": charge,
            "describe": describe,
            "demand": demand,
            "detail_describe": detail_describe,
            "detail": detail
        }
        return body

    # 同步mysql和es的数据
    # 两边都有的表
    both_set = from_mysql.keys() & from_es.keys()
    for i in both_set:

        if from_mysql[i].keys() == from_es[i].keys():
            continue

        both_col_set = from_mysql[i].keys() & from_es[i].keys()
        # 共有的column取es中带有describe的数据
        both_col_set_es = {}
        for j in both_col_set:
            both_col_set_es = {**both_col_set_es, j: from_es[i][j]}

        # mysql多的column
        x = from_mysql[i].keys() - from_es[i].keys()
        y = from_es[i].keys() - from_mysql[i].keys()
        if len(x) > 0 or len(y) > 0:
            mysql_col_only = {}
            for j in x:
                # print(from_mysql[i][j])
                # jj={}
                mysql_col_only = {**mysql_col_only, j: from_mysql[i][j]}
            # 保留原es数据，再加上新字段
            new_cols = {**both_col_set_es, **mysql_col_only}

            info = es.get(index='dw_table', doc_type='awesome_table', id=i)
            print(i)
            body = format_render(cols=new_cols, table_name=i, charge=info['_source'].get('charge',''),describe=info['_source'].get('describe',''), demand=info['_source'].get('demand',''),detail_describe=info['_source'].get('detail_describe',''))
            es.index(index='dw_table', doc_type='awesome_table', id=i, body=body)

        # es多的column... 已经与mysql多时一起处理了
        # 一共四种情况：两边字段完全相同，es mysql各自有多的字段，仅mysql比es字段多，仅es比mysql字段多。最终是取共有字段+mysql多的字段，可以把后三种写在一起： len(x) > 0 or len(y) > 0 .以减少 info = es.get(index='dw_table', doc_type='awesome_table', id=i) 请求的次数

    # mysql_only 的表，在es中加上
    mysql_only = from_mysql.keys() - from_es.keys()
    for i in mysql_only:
        body = format_render(from_mysql[i], table_name=i)
        es.index(index='dw_table', doc_type='awesome_table', id=i, body=body)

    # es_only 的，删除。
    # 避免是因为mysql查数出问题而导致es的误删...
    # if len(from_mysql.keys()) > 500:
    #     es_only = from_es.keys() - from_mysql.keys()
    #     for i in es_only:
    #         es.delete(index='dw_table', doc_type='awesome_table', id=i)

    # es_only 的，不删除！表删了而es里有的，也不删除，避免 '删表-refresh-重建表' 导致的已填数据丢失。即使是确实删表也没有必要删es里的数据。之后若新建表作他用，反正会把新字段搞上的。

if __name__ =='__main__':
    keep_es_informed()
