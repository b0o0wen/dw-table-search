def must_certain_keyword(str):
    x={"bool": {
      "should": [
        {"term": {
          "table_name": {
            "value": str
          }
        }},
        {"term": {
          "describe": {
            "value": str
          }
        }},
        {"term": {
          "demand": {
            "value": str
          }
        }},
        {"term": {
          "charge": {
            "value": str
          }
        }},
        {"term": {
          "detail_describe": {
            "value": str
          }
        }},
        {"term": {
          "detail.col_name": {
            "value": str
          }
        }},
        {"term": {
          "detail.describe": {
            "value": str
          }
        }}
      ]
    }}
    return x


def query_body(query_str,str_ch,str_en,must_str=None):
    should_part = {
          "should": [
            {
                "match": {
                    "table_name": {
                        "query": str_en,
                        "boost": 5
                    }
                }
            },
            {
                "match": {
                    "describe": {
                        "query": str_ch,
                        "boost": 2
                    }
                }
            },
            {
                "match": {
                    "charge": query_str
                }
            },
            {
                "match": {
                    "demand": query_str
                }
            },
            {
                "match": {
                    "detail.col_name": str_en
                }
            },
            {
                "match": {
                    "detail.describe": str_ch
                }
            },
            {
                "match": {
                    "detail.example": query_str
                }
            }
        ]
    }

    if must_str == None:
        x = {
            "size": 50,
            "query": {
                "bool": {**should_part}
            }
        }
        return x
    elif must_str == ['']:
        must_part = {
            "must":[{
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must_not": [
                                    {
                                        "wildcard": {
                                            "charge": {
                                                "value": "*"
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "bool": {
                                "must_not": [
                                    {
                                        "wildcard": {
                                            "demand": {
                                                "value": "*"
                                            }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            "bool": {
                                "must_not": [
                                    {
                                        "wildcard": {
                                            "table_name": {
                                                "value": "*"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }]
        }
        x = {
            "size": 2000,
            "query": {
                "bool": {**must_part, **should_part}
            }
        }
        return x
    else:
        must_part = {"must": [{
            "bool": {
                "must": [
                    must_certain_keyword(i) for i in must_str
                ]
            }
        }]}
        x = {
            "size": 2000,
            "query": {
                "bool": {**must_part, **should_part}
            }
        }
        return x