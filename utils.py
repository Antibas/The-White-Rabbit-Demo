
def import_datasets():
    print("Loading the datasets. This may take a while...")
    import white_rabbit.algorithms.dbpedia as dbpedia
    import white_rabbit.algorithms.wikidata as wikidata
    import white_rabbit.algorithms.yago as yago
    return {
        "DBPEDIA": dbpedia,
        "WIKIDATA": wikidata,
        "YAGO": yago,
    }

def load_nodes():
    with open("white_rabbit/config/nodes.conf") as nodes_file:
        return list(node.strip() for node in nodes_file.readlines())