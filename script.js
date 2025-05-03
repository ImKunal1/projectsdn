let simulation;
let svg;
let networkData = {
    nodes: [],
    links: []
};

document.addEventListener('DOMContentLoaded', () => {
    // Button elements
    const optimizeBtn = document.querySelector('.optimize-btn');
    const congestionBtn = document.querySelector('.congestion-btn');
    const resetBtn = document.querySelector('.reset-btn');
    const hideArBtn = document.querySelector('.hide-ar');

    // Counter elements
    const nodesCount = document.getElementById('nodes-count');
    const linksCount = document.getElementById('links-count');
    const increaseNodesBtn = document.querySelector('.increase-nodes');
    const decreaseNodesBtn = document.querySelector('.decrease-nodes');
    const increaseLinksBtn = document.querySelector('.increase-links');
    const decreaseLinksBtn = document.querySelector('.decrease-links');

    // Initialize SVG
    const container = document.getElementById('network-container');
    svg = d3.select('#network-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');

    // Counter handlers
    increaseNodesBtn.addEventListener('click', () => {
        const currentCount = parseInt(nodesCount.textContent);
        nodesCount.textContent = currentCount + 1;
        updateNetwork();
    });

    decreaseNodesBtn.addEventListener('click', () => {
        const currentCount = parseInt(nodesCount.textContent);
        if (currentCount > 1) {
            nodesCount.textContent = currentCount - 1;
            updateNetwork();
        }
    });

    increaseLinksBtn.addEventListener('click', () => {
        const currentCount = parseInt(linksCount.textContent);
        const maxLinks = parseInt(nodesCount.textContent) * (parseInt(nodesCount.textContent) - 1) / 2;
        if (currentCount < maxLinks) {
            linksCount.textContent = currentCount + 1;
            updateNetwork();
        }
    });

    decreaseLinksBtn.addEventListener('click', () => {
        const currentCount = parseInt(linksCount.textContent);
        if (currentCount > 0) {
            linksCount.textContent = currentCount - 1;
            updateNetwork();
        }
    });

    // Button click handlers
    optimizeBtn.addEventListener('click', () => {
        console.log('Optimizing routes...');
        optimizeRoutes();
    });

    congestionBtn.addEventListener('click', () => {
        console.log('Simulating congestion...');
        simulateCongestion();
    });

    resetBtn.addEventListener('click', () => {
        console.log('Resetting network...');
        resetNetwork();
    });

    hideArBtn.addEventListener('click', () => {
        console.log('Toggling AR mode...');
    });

    // Initialize network view
    initializeNetworkView();
});

function initializeNetworkView() {
    const nodeCount = parseInt(document.getElementById('nodes-count').textContent);
    const linkCount = parseInt(document.getElementById('links-count').textContent);
    
    // Create nodes
    networkData.nodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: i,
        name: `Node ${i + 1}`,
        traffic: Math.random() * 100,
        status: 'normal'
    }));

    // Create links
    networkData.links = [];
    while (networkData.links.length < linkCount) {
        const source = Math.floor(Math.random() * nodeCount);
        const target = Math.floor(Math.random() * nodeCount);
        if (source !== target && !networkData.links.some(l => 
            (l.source === source && l.target === target) || 
            (l.source === target && l.target === source))) {
            networkData.links.push({
                source,
                target,
                value: Math.random() * 100,
                status: 'normal'
            });
        }
    }

    createVisualization();
}

function createVisualization() {
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;

    // Clear existing visualization
    svg.selectAll('*').remove();

    // Create simulation
    simulation = d3.forceSimulation(networkData.nodes)
        .force('link', d3.forceLink(networkData.links).id(d => d.id))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const links = svg.append('g')
        .selectAll('line')
        .data(networkData.links)
        .enter()
        .append('line')
        .attr('class', 'link');

    // Create nodes
    const nodes = svg.append('g')
        .selectAll('circle')
        .data(networkData.nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', 10)
        .call(drag(simulation));

    // Add tooltips
    nodes.on('mouseover', showTooltip)
         .on('mouseout', hideTooltip);

    // Update positions
    simulation.on('tick', () => {
        links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodes
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    });
}

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

function showTooltip(event, d) {
    const tooltip = d3.select('#tooltip');
    tooltip.style('opacity', 1)
           .html(`${d.name}<br>Traffic: ${d.traffic.toFixed(1)}`)
           .style('left', (event.pageX + 10) + 'px')
           .style('top', (event.pageY - 10) + 'px');
}

function hideTooltip() {
    d3.select('#tooltip').style('opacity', 0);
}

function updateNetwork() {
    initializeNetworkView();
}

function simulateCongestion() {
    // Randomly congest some nodes and links
    networkData.nodes.forEach(node => {
        if (Math.random() < 0.3) {
            node.status = 'congested';
        }
    });

    networkData.links.forEach(link => {
        if (Math.random() < 0.3) {
            link.status = 'congested';
        }
    });

    // Update visualization
    svg.selectAll('.node')
        .attr('class', d => `node ${d.status}`);

    svg.selectAll('.link')
        .attr('class', d => `link ${d.status}`);
}

function optimizeRoutes() {
    // Reset congestion
    networkData.nodes.forEach(node => node.status = 'normal');
    networkData.links.forEach(link => {
        link.status = 'normal';
        if (Math.random() < 0.3) {
            link.status = 'active';
        }
    });

    // Update visualization
    svg.selectAll('.node')
        .attr('class', 'node');

    svg.selectAll('.link')
        .attr('class', d => `link ${d.status}`);
}

function resetNetwork() {
    networkData.nodes.forEach(node => node.status = 'normal');
    networkData.links.forEach(link => link.status = 'normal');

    // Update visualization
    svg.selectAll('.node')
        .attr('class', 'node');

    svg.selectAll('.link')
        .attr('class', 'link');
} 