
document.addEventListener("DOMContentLoaded", function() {
    // Hide the time quantum input initially
    document.querySelector(".form-group-time-quantum").style.display = "none";

    // Show/hide time quantum based on selected algorithm
    document.getElementById('algorithmSelector').addEventListener('change', function() {
        if (this.value === 'optRR') {
            document.querySelector(".form-group-time-quantum").style.display = "block";
        } else {
            document.querySelector(".form-group-time-quantum").style.display = "none";
        }
    });

    var processList = [];

    // Add process
    document.getElementById('btnAddProcess').addEventListener('click', function() {
        var processID = document.getElementById('processID');
        var arrivalTime = document.getElementById('arrivalTime');
        var burstTime = document.getElementById('burstTime');

        if (processID.value === '' || arrivalTime.value === '' || burstTime.value === '') {
            processID.classList.add('is-invalid');
            arrivalTime.classList.add('is-invalid');
            burstTime.classList.add('is-invalid');
            return;
        }

        var process = {
            processID: parseInt(processID.value, 10),
            arrivalTime: parseInt(arrivalTime.value, 10),
            burstTime: parseInt(burstTime.value, 10)
        };

        processList.push(process);

        var newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${processID.value}</td>
            <td>${arrivalTime.value}</td>
            <td>${burstTime.value}</td>
        `;
        document.querySelector('#tblProcessList > tbody').appendChild(newRow);

        processID.value = '';
        arrivalTime.value = '';
        burstTime.value = '';
    });

    // Calculate results based on selected algorithm
    document.getElementById('btnCalculate').addEventListener('click', function() {
        if (processList.length == 0) {
            alert('Please insert some processes');
            return;
        }

        var selectedAlgo = document.getElementById('algorithmSelector').value;

        switch (selectedAlgo) {
            case 'optFCFS':
                firstComeFirstServed();
                break;
            case 'optSJF':
                shortestJobFirst();
                break;
            case 'optSRTF':
                shortestRemainingTimeFirst();
                break;
            case 'optRR':
                roundRobin();
                break;
        }
    });

    function firstComeFirstServed() {
        var time = 0;
        var queue = [];
        var completedList = [];

        while (processList.length > 0 || queue.length > 0) {
            while (queue.length == 0) {
                time++;
                addToQueue();
            }

            var process = queue.shift();
            for (var i = 0; i < process.burstTime; i++) {
                time++;
                addToQueue();
            }
            process.completedTime = time;
            process.turnAroundTime = process.completedTime - process.arrivalTime;
            process.waitingTime = process.turnAroundTime - process.burstTime;
            completedList.push(process);
        }

        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (time >= processList[i].arrivalTime) {
                    var process = processList.splice(i, 1)[0];
                    queue.push(process);
                }
            }
        }

        bindResults(completedList);
    }

    function shortestJobFirst() {
        var completedList = [];
        var time = 0;
        var queue = [];

        while (processList.length > 0 || queue.length > 0) {
            addToQueue();
            while (queue.length == 0) {
                time++;
                addToQueue();
            }
            var processToRun = selectProcess();
            for (var i = 0; i < processToRun.burstTime; i++) {
                time++;
                addToQueue();
            }
            processToRun.completedTime = time;
            processToRun.turnAroundTime = processToRun.completedTime - processToRun.arrivalTime;
            processToRun.waitingTime = processToRun.turnAroundTime - processToRun.burstTime;
            completedList.push(processToRun);
        }

        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (processList[i].arrivalTime === time) {
                    var process = processList.splice(i, 1)[0];
                    queue.push(process);
                }
            }
        }

        function selectProcess() {
            if (queue.length != 0) {
                queue.sort(function(a, b) {
                    return a.burstTime - b.burstTime;
                });
            }
            return queue.shift();
        }

        bindResults(completedList);
    }

    function shortestRemainingTimeFirst() {
        var completedList = [];
        var time = 0;
        var queue = [];

        while (processList.length > 0 || queue.length > 0) {
            addToQueue();
            while (queue.length == 0) {
                time++;
                addToQueue();
            }
            selectProcessForSRTF();
            runSRTF();
        }

        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (processList[i].arrivalTime === time) {
                    var process = processList.splice(i, 1)[0];
                    queue.push(process);
                }
            }
        }

        function selectProcessForSRTF() {
            if (queue.length != 0) {
                queue.sort(function(a, b) {
                    return a.burstTime - b.burstTime;
                });
                if (queue[0].burstTime == 1) {
                    var process = queue.shift();
                    process.completedTime = time + 1;
                    completedList.push(process);
                } else if (queue[0].burstTime > 1) {
                    queue[0].burstTime--;
                }
            }
        }

        function runSRTF() {
            time++;
            addToQueue();
        }

        resetBurstTime(completedList);
        bindResults(completedList);
    }

    function roundRobin() {
        var timeQuantum = document.getElementById('timeQuantum');
        var timeQuantumVal = parseInt(timeQuantum.value, 10);
        if (timeQuantum.value == '') {
            alert('Please enter time quantum');
            timeQuantum.classList.add('is-invalid');
            return;
        }
        var completedList = [];
        var time = 0;
        var queue = [];

        while (processList.length > 0 || queue.length > 0) {
            addToQueue();
            while (queue.length == 0) {
                time++;
                addToQueue();
            }
            selectProcessForRR();
        }

        function addToQueue() {
            for (var i = 0; i < processList.length; i++) {
                if (processList[i].arrivalTime === time) {
                    var process = processList.splice(i, 1)[0];
                    queue.push(process);
                }
            }
        }

        function selectProcessForRR() {
            if (queue.length != 0) {
                queue.sort(function(a, b) {
                    return a.burstTime - b.burstTime;
                });

                if (queue[0].burstTime < timeQuantumVal) {
                    var process = queue.shift();
                    process.completedTime = time + process.burstTime;

                    for (var index = 0; index < process.burstTime; index++) {
                        time++;
                        addToQueue();
                    }
                    completedList.push(process);

                } else if (queue[0].burstTime == timeQuantumVal) {
                    var process = queue.shift();
                    process.completedTime = time + timeQuantumVal;
                    completedList.push(process);

                    for (var index = 0; index < timeQuantumVal; index++) {
                        time++;
                        addToQueue();
                    }
                } else if (queue[0].burstTime > timeQuantumVal) {
                    var process = queue[0];
                    queue[0].burstTime -= timeQuantumVal;

                    for (var index = 0; index < timeQuantumVal; index++) {
                        time++;
                        addToQueue();
                    }
                }
            }
        }

        resetBurstTime(completedList);
        bindResults(completedList);
    }

    function bindResults(completedList) {
        var resultsBody = document.querySelector('#tblResults > tbody');
        resultsBody.innerHTML = '';
    
        completedList.forEach(function(process) {
            var newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${process.processID}</td>
                <td>${process.arrivalTime}</td>
                <td>${process.burstTime}</td>
                <td>${process.completedTime}</td>
                <td>${process.waitingTime}</td>
                <td>${process.turnAroundTime}</td>
            `;
            resultsBody.appendChild(newRow);
        });
    
        var avgTurnaroundTime = 0;
        var avgWaitingTime = 0;
        var maxCompletedTime = 0;
        var throughput = 0;
    
        completedList.forEach(function(process) {
            if (process.completedTime > maxCompletedTime) {
                maxCompletedTime = process.completedTime;
            }
            avgTurnaroundTime += process.turnAroundTime;
            avgWaitingTime += process.waitingTime;
        });
    
        avgTurnaroundTime /= completedList.length;
        avgWaitingTime /= completedList.length;
        throughput = completedList.length / maxCompletedTime;
    
        document.getElementById('avgTurnaroundTime').textContent = avgTurnaroundTime.toFixed(2);
        document.getElementById('avgWaitingTime').textContent = avgWaitingTime.toFixed(2);
        document.getElementById('throughput').textContent = throughput.toFixed(2);
    }
    
    function resetBurstTime(completedList) {
        completedList.forEach(function(process) {
            process.burstTime = process.originalBurstTime; // Assuming you have an 'originalBurstTime' property in your process objects
        });
    }
    
});

    
