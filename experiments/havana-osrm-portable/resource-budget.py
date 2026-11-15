"""Synthetic offline OSRM resource budget estimator, NOT an OSRM benchmark."""
import argparse, json

def estimate(nodes, edges, bytes_per_node=128, bytes_per_edge=192, multiplier=4):
    if any(type(x) is not int or x < 0 for x in (nodes, edges, bytes_per_node, bytes_per_edge, multiplier)):
        raise ValueError('nonnegative integers required')
    if not 1 <= multiplier <= 20: raise ValueError('invalid multiplier')
    graph = nodes*bytes_per_node + edges*bytes_per_edge
    return {'synthetic_graph_bytes':graph, 'synthetic_peak_bytes':graph*multiplier,
            'note':'Hypothetical coefficient model only; not measured OSRM usage'}

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--nodes',type=int,default=10000);p.add_argument('--edges',type=int,default=25000)
    a=p.parse_args(); print(json.dumps(estimate(a.nodes,a.edges),sort_keys=True))
