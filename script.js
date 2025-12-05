// Supabase setup
const SUPABASE_URL = 'https://nzdvgphyrkuswqcvfenn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZHZncGh5cmt1c3dxY3ZlZm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5Mzk3MjUsImV4cCI6MjA4MDUxNTcyNX0.t0NyeVJTtjPk7R1eU74W6ulU9_qyrlZWCx-keXkHDoU';

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Calendar state
let currentDate = new Date();
let trackingData = {};
let currentView = 'month'; // 'month', 'year', 'range', 'analytics'
let rangeStart = null;
let rangeEnd = null;
let userName = '';
let currentUser = null;

// Load saved data from Supabase or localStorage
async function loadData() {
    if (currentUser && supabase) {
        // Load from Supabase
        try {
            const { data, error } = await supabase
                .from('tracking_entries')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('date', { ascending: true });
            
            if (error) {
                console.error('Error loading data:', error);
                // Fallback to localStorage
                loadFromLocalStorage();
            } else {
                // Convert Supabase data to trackingData format
                trackingData = {};
                data.forEach(entry => {
                    const dateKey = entry.date;
                    trackingData[dateKey] = {
                        sober: entry.sober,
                        drinks: entry.drinks,
                        occasion: entry.occasion
                    };
                });
            }
        } catch (err) {
            console.error('Error:', err);
            loadFromLocalStorage();
        }
    } else {
        // Fallback to localStorage
        loadFromLocalStorage();
    }
    
    const savedName = localStorage.getItem('tipsyTigerName');
    if (savedName) {
        userName = savedName;
    }
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('tipsyTigerData');
    if (saved) {
        trackingData = JSON.parse(saved);
    }
}

// Save data to Supabase or localStorage
async function saveData() {
    if (currentUser && supabase) {
        // Save to Supabase
        try {
            // Get all entries to sync
            const entries = Object.keys(trackingData).map(dateKey => ({
                user_id: currentUser.id,
                date: dateKey,
                sober: trackingData[dateKey].sober,
                drinks: trackingData[dateKey].drinks || null,
                occasion: trackingData[dateKey].occasion || null
            }));
            
            // Upsert all entries
            const { error } = await supabase
                .from('tracking_entries')
                .upsert(entries, { onConflict: 'user_id,date' });
            
            if (error) {
                console.error('Error saving data:', error);
                // Fallback to localStorage
                localStorage.setItem('tipsyTigerData', JSON.stringify(trackingData));
            }
        } catch (err) {
            console.error('Error:', err);
            localStorage.setItem('tipsyTigerData', JSON.stringify(trackingData));
        }
    } else {
        // Fallback to localStorage
        localStorage.setItem('tipsyTigerData', JSON.stringify(trackingData));
    }
}

// Save individual entry
async function saveEntry(dateKey, data) {
    trackingData[dateKey] = data;
    
    if (currentUser && supabase) {
        try {
            const { error } = await supabase
                .from('tracking_entries')
                .upsert({
                    user_id: currentUser.id,
                    date: dateKey,
                    sober: data.sober,
                    drinks: data.drinks || null,
                    occasion: data.occasion || null
                }, { onConflict: 'user_id,date' });
            
            if (error) {
                console.error('Error saving entry:', error);
                localStorage.setItem('tipsyTigerData', JSON.stringify(trackingData));
            }
        } catch (err) {
            console.error('Error:', err);
            localStorage.setItem('tipsyTigerData', JSON.stringify(trackingData));
        }
    } else {
        localStorage.setItem('tipsyTigerData', JSON.stringify(trackingData));
    }
}

// Check authentication status
async function checkAuth() {
    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            await loadData();
            showUserSection();
            renderCalendar();
        } else {
            showAuthSection();
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                currentUser = session.user;
                loadData().then(() => {
                    showUserSection();
                    renderCalendar();
                });
            } else {
                currentUser = null;
                trackingData = {};
                showAuthSection();
            }
        });
    } else {
        // No Supabase, use localStorage
        loadData();
        showNameSection();
    }
}

function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('nameSection').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('userSection').style.display = 'none';
}

function showNameSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('nameSection').style.display = 'flex';
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('userSection').style.display = 'none';
}

function showUserSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('nameSection').style.display = 'none';
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('userSection').style.display = 'block';
    if (currentUser) {
        document.getElementById('userEmail').textContent = currentUser.email;
        userName = currentUser.email.split('@')[0];
        showWelcomeMessage();
    }
}

// Initialize auth check
checkAuth();

// Get month and year string
function getMonthYearString(date) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Get date key for storage (YYYY-MM-DD format)
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get CSS class based on tracking data
function getDayClass(dateKey) {
    const data = trackingData[dateKey];
    if (!data) return '';
    
    if (data.sober) {
        return 'sober';
    } else if (data.drinks === 1) {
        return 'drinks-1';
    } else if (data.drinks === 2) {
        return 'drinks-2';
    } else if (data.drinks === 3) {
        return 'drinks-3';
    } else if (data.drinks === 4) {
        return 'drinks-4';
    } else if (data.drinks === 5) {
        return 'drinks-5';
    } else if (data.drinks >= 6) {
        return 'drinks-5plus';
    }
    return '';
}

// Render calendar based on current view
function renderCalendar() {
    if (currentView === 'month') {
        renderMonthView();
    } else if (currentView === 'year') {
        renderYearView();
    } else if (currentView === 'range') {
        renderDateRangeView();
    } else if (currentView === 'analytics') {
        renderAnalyticsView();
    }
}

// Render month view
function renderMonthView() {
    const monthYear = document.getElementById('currentMonth');
    monthYear.textContent = getMonthYearString(currentDate);
    
    const grid = document.getElementById('calendarGrid');
    grid.className = 'calendar-grid';
    grid.innerHTML = '';
    
    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        grid.appendChild(emptyDay);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateKey = getDateKey(date);
        const dayClass = getDayClass(dateKey);
        
        if (dayClass) {
            dayElement.classList.add(dayClass);
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add indicator if there's data
        const data = trackingData[dateKey];
        if (data) {
            const indicator = document.createElement('div');
            indicator.className = 'day-indicator';
            if (data.sober) {
                indicator.textContent = '✨';
            } else {
                indicator.textContent = '🍷';
            }
            dayElement.appendChild(indicator);
        }
        
        // Click handler
        dayElement.addEventListener('click', () => {
            openSoberModal(date, dateKey, dayElement);
        });
        
        grid.appendChild(dayElement);
    }
}

// Render year view
function renderYearView() {
    const monthYear = document.getElementById('currentMonth');
    monthYear.textContent = currentDate.getFullYear();
    
    const grid = document.getElementById('calendarGrid');
    grid.className = 'year-grid';
    grid.innerHTML = '';
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        
        const monthTitle = document.createElement('h3');
        monthTitle.className = 'month-title';
        monthTitle.textContent = months[month];
        monthContainer.appendChild(monthTitle);
        
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        // Day headers
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header-small';
            header.textContent = day;
            monthGrid.appendChild(header);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(currentDate.getFullYear(), month, 1);
        const lastDay = new Date(currentDate.getFullYear(), month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Empty cells
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day-small empty';
            monthGrid.appendChild(emptyDay);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day-small';
            
            const date = new Date(currentDate.getFullYear(), month, day);
            const dateKey = getDateKey(date);
            const dayClass = getDayClass(dateKey);
            
            if (dayClass) {
                dayElement.classList.add(dayClass);
            }
            
            dayElement.textContent = day;
            
            // Click handler
            dayElement.addEventListener('click', () => {
                currentDate = new Date(currentDate.getFullYear(), month, day);
                currentView = 'month';
                updateViewButtons();
                renderCalendar();
            });
            
            monthGrid.appendChild(dayElement);
        }
        
        monthContainer.appendChild(monthGrid);
        grid.appendChild(monthContainer);
    }
}

// Render date range view
function renderDateRangeView() {
    if (!rangeStart || !rangeEnd) {
        const grid = document.getElementById('calendarGrid');
        grid.className = 'calendar-grid';
        grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Select a date range above to view your progress</div>';
        return;
    }
    
    const monthYear = document.getElementById('currentMonth');
    const startStr = rangeStart.toLocaleDateString();
    const endStr = rangeEnd.toLocaleDateString();
    monthYear.textContent = `${startStr} - ${endStr}`;
    
    const container = document.getElementById('calendarGrid');
    container.className = 'range-container';
    container.innerHTML = '';
    
    // Get month names
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Calculate all months from start to end
    const monthsToShow = [];
    const currentMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    const endMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
        monthsToShow.push({
            year: currentMonth.getFullYear(),
            month: currentMonth.getMonth()
        });
        // Move to next month
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // Render each month in order
    monthsToShow.forEach(monthData => {
        const monthName = months[monthData.month];
        
        // Create month container (like year view)
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-container';
        
        const monthTitle = document.createElement('h3');
        monthTitle.className = 'month-title';
        monthTitle.textContent = `${monthName} ${monthData.year}`;
        monthContainer.appendChild(monthTitle);
        
        const monthGrid = document.createElement('div');
        monthGrid.className = 'month-grid';
        
        // Day headers (small)
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header-small';
            header.textContent = day;
            monthGrid.appendChild(header);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(monthData.year, monthData.month, 1);
        const lastDay = new Date(monthData.year, monthData.month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Empty cells before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day-small empty';
            monthGrid.appendChild(emptyDay);
        }
        
        // Render all days in month, but only highlight dates in range
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(monthData.year, monthData.month, day);
            const dateKey = getDateKey(date);
            const isInRange = date >= rangeStart && date <= rangeEnd;
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day-small';
            
            if (!isInRange) {
                dayElement.classList.add('out-of-range');
            }
            
            const dayClass = getDayClass(dateKey);
            if (dayClass && isInRange) {
                dayElement.classList.add(dayClass);
            }
            
            dayElement.textContent = day;
            
            // Click handler only for dates in range
            if (isInRange) {
                dayElement.addEventListener('click', () => {
                    currentDate = new Date(monthData.year, monthData.month, day);
                    currentView = 'month';
                    updateViewButtons();
                    renderCalendar();
                });
            }
            
            monthGrid.appendChild(dayElement);
        }
        
        monthContainer.appendChild(monthGrid);
        container.appendChild(monthContainer);
    });
}

// Render analytics view
function renderAnalyticsView() {
    const monthYear = document.getElementById('currentMonth');
    monthYear.textContent = 'Analytics & Insights';
    
    const container = document.getElementById('calendarGrid');
    container.className = 'analytics-container';
    container.innerHTML = '';
    
    // Calculate insights
    const allDates = Object.keys(trackingData);
    if (allDates.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No data yet! Start tracking to see insights 🐅</div>';
        return;
    }
    
    // Sort dates
    allDates.sort();
    const firstDate = new Date(allDates[0]);
    const lastDate = new Date(allDates[allDates.length - 1]);
    
    // Calculate stats
    let totalDays = 0;
    let soberDays = 0;
    let drinkDays = 0;
    let totalDrinks = 0;
    let maxDrinks = 0;
    let drinksByDay = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let drinksByMonth = {};
    let drinksByDayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    allDates.forEach(dateKey => {
        const data = trackingData[dateKey];
        totalDays++;
        
        if (data.sober) {
            soberDays++;
            drinksByDay[0]++;
        } else if (data.drinks) {
            drinkDays++;
            totalDrinks += data.drinks;
            maxDrinks = Math.max(maxDrinks, data.drinks);
            
            const drinkCount = data.drinks;
            if (drinkCount === 1) {
                drinksByDay[1] = (drinksByDay[1] || 0) + 1;
            } else if (drinkCount === 2) {
                drinksByDay[2] = (drinksByDay[2] || 0) + 1;
            } else if (drinkCount === 3) {
                drinksByDay[3] = (drinksByDay[3] || 0) + 1;
            } else if (drinkCount === 4) {
                drinksByDay[4] = (drinksByDay[4] || 0) + 1;
            } else if (drinkCount === 5) {
                drinksByDay[5] = (drinksByDay[5] || 0) + 1;
            } else if (drinkCount >= 6) {
                drinksByDay[6] = (drinksByDay[6] || 0) + 1;
            }
            
            const date = new Date(dateKey);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            drinksByMonth[monthKey] = (drinksByMonth[monthKey] || 0) + data.drinks;
            
            const dayOfWeek = date.getDay();
            drinksByDayOfWeek[dayOfWeek] = (drinksByDayOfWeek[dayOfWeek] || 0) + data.drinks;
        }
    });
    
    const avgDrinks = drinkDays > 0 ? (totalDrinks / drinkDays).toFixed(1) : 0;
    const soberPercentage = totalDays > 0 ? ((soberDays / totalDays) * 100).toFixed(1) : 0;
    
    // Find most active month
    let maxMonthDrinks = 0;
    let maxMonthKey = '';
    Object.keys(drinksByMonth).forEach(key => {
        if (drinksByMonth[key] > maxMonthDrinks) {
            maxMonthDrinks = drinksByMonth[key];
            maxMonthKey = key;
        }
    });
    
    // Find most active day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let maxDayDrinks = 0;
    let maxDayIndex = 0;
    let drinksByDayCount = {};
    Object.keys(drinksByDayOfWeek).forEach(day => {
        if (drinksByDayOfWeek[day] > maxDayDrinks) {
            maxDayDrinks = drinksByDayOfWeek[day];
            maxDayIndex = parseInt(day);
        }
    });
    
    // Count drinking days by day of week
    allDates.forEach(dateKey => {
        const data = trackingData[dateKey];
        if (data && !data.sober && data.drinks) {
            const date = new Date(dateKey);
            const dayOfWeek = date.getDay();
            drinksByDayCount[dayOfWeek] = (drinksByDayCount[dayOfWeek] || 0) + 1;
        }
    });
    
    // Find best month (most sober days or least drinks)
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let bestMonthKey = '';
    let bestMonthSoberDays = 0;
    let monthStats = {};
    
    allDates.forEach(dateKey => {
        const data = trackingData[dateKey];
        const date = new Date(dateKey);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthStats[monthKey]) {
            monthStats[monthKey] = { sober: 0, drinks: 0, total: 0 };
        }
        
        monthStats[monthKey].total++;
        if (data.sober) {
            monthStats[monthKey].sober++;
        } else if (data.drinks) {
            monthStats[monthKey].drinks += data.drinks;
        }
        
        if (monthStats[monthKey].sober > bestMonthSoberDays) {
            bestMonthSoberDays = monthStats[monthKey].sober;
            bestMonthKey = monthKey;
        }
    });
    
    // Create insights cards
    const insights = [
        {
            title: '📊 Overall Stats',
            items: [
                `Total Days Tracked: ${totalDays}`,
                `Sober Days: ${soberDays} (${soberPercentage}%)`,
                `Days with Drinks: ${drinkDays}`,
                `Total Drinks: ${totalDrinks}`,
                `Average per Drinking Day: ${avgDrinks}`
            ]
        },
        {
            title: '🏆 Records',
            items: [
                `Most Drinks in One Day: ${maxDrinks}`,
                maxMonthKey ? `Most Active Month: ${new Date(maxMonthKey + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'N/A',
                `Most Active Day: ${dayNames[maxDayIndex]}`
            ]
        },
        {
            title: '📈 Distribution',
            items: [
                `Sober Days: ${drinksByDay[0]}`,
                `1 Drink Days: ${drinksByDay[1] || 0}`,
                `2 Drink Days: ${drinksByDay[2] || 0}`,
                `3 Drink Days: ${drinksByDay[3] || 0}`,
                `4 Drink Days: ${drinksByDay[4] || 0}`,
                `5 Drink Days: ${drinksByDay[5] || 0}`,
                `5+ Drink Days: ${drinksByDay[6] || 0}`
            ]
        },
        {
            title: '💡 Insights',
            items: [
                soberPercentage >= 70 ? '✨ Great job staying sober most days!' : soberPercentage >= 50 ? '👍 Good balance!' : '💪 Keep tracking!',
                drinkDays > 0 && avgDrinks <= 2 ? '🍷 You\'re keeping it moderate!' : drinkDays > 0 && avgDrinks > 4 ? '⚠️ Consider moderation' : '',
                maxDrinks >= 5 ? '⚠️ Watch out for high consumption days' : '',
                `Tracking since: ${firstDate.toLocaleDateString()}`
            ].filter(item => item !== '')
        },
        {
            title: '🔍 Pattern Insights',
            items: (() => {
                const patterns = [];
                
                // Most active day of week pattern
                if (maxDayDrinks > 0 && drinkDays > 5) {
                    const avgByDay = drinksByDayOfWeek[maxDayIndex] / (drinksByDayCount[maxDayIndex] || 1);
                    patterns.push(`You tend to drink more on ${dayNames[maxDayIndex]}s`);
                }
                
                // Best month
                if (bestMonthKey && bestMonthSoberDays > 0) {
                    const [year, month] = bestMonthKey.split('-');
                    patterns.push(`Your best month was ${months[parseInt(month)]} ${year} (${bestMonthSoberDays} sober days)`);
                }
                
                // Most active month
                if (maxMonthKey && maxMonthDrinks > 0) {
                    const [year, month] = maxMonthKey.split('-');
                    patterns.push(`Most active month: ${months[parseInt(month)]} ${year} (${maxMonthDrinks} total drinks)`);
                }
                
                // Weekend vs weekday pattern
                const weekendDrinks = (drinksByDayOfWeek[0] || 0) + (drinksByDayOfWeek[6] || 0);
                const weekdayDrinks = (drinksByDayOfWeek[1] || 0) + (drinksByDayOfWeek[2] || 0) + (drinksByDayOfWeek[3] || 0) + (drinksByDayOfWeek[4] || 0) + (drinksByDayOfWeek[5] || 0);
                if (weekendDrinks > weekdayDrinks * 1.5 && drinkDays > 10) {
                    patterns.push('You tend to drink more on weekends');
                } else if (weekdayDrinks > weekendDrinks * 1.5 && drinkDays > 10) {
                    patterns.push('You tend to drink more on weekdays');
                }
                
                return patterns.length > 0 ? patterns : ['Keep tracking to see your patterns!'];
            })()
        }
    ];
    
    insights.forEach(insight => {
        const card = document.createElement('div');
        card.className = 'analytics-card';
        
        const title = document.createElement('h3');
        title.className = 'analytics-card-title';
        title.textContent = insight.title;
        card.appendChild(title);
        
        const list = document.createElement('ul');
        list.className = 'analytics-list';
        insight.items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });
        card.appendChild(list);
        
        container.appendChild(card);
    });
}

// Open sober modal
let selectedDate = null;
let selectedDateKey = null;
let selectedDayElement = null;

function openSoberModal(date, dateKey, dayElement) {
    selectedDate = date;
    selectedDateKey = dateKey;
    selectedDayElement = dayElement;
    
    const modal = document.getElementById('soberModal');
    modal.classList.add('show');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// Update view buttons
function updateViewButtons() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const container = document.querySelector('.container');
    
    if (currentView === 'month') {
        document.getElementById('viewMonth').classList.add('active');
        document.getElementById('calendarHeader').style.display = 'flex';
        document.getElementById('dateRangeSelector').style.display = 'none';
        container.classList.remove('year-view', 'range-view');
    } else if (currentView === 'year') {
        document.getElementById('viewYear').classList.add('active');
        document.getElementById('calendarHeader').style.display = 'flex';
        document.getElementById('dateRangeSelector').style.display = 'none';
        container.classList.add('year-view');
        container.classList.remove('range-view');
    } else if (currentView === 'range') {
        document.getElementById('viewRange').classList.add('active');
        document.getElementById('calendarHeader').style.display = 'none';
        document.getElementById('dateRangeSelector').style.display = 'block';
        container.classList.add('range-view');
    } else if (currentView === 'analytics') {
        document.getElementById('viewAnalytics').classList.add('active');
        document.getElementById('calendarHeader').style.display = 'flex';
        document.getElementById('dateRangeSelector').style.display = 'none';
        container.classList.remove('year-view', 'range-view');
    }
}

// Show welcome message
function showWelcomeMessage() {
    const nameSection = document.getElementById('nameSection');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (userName) {
        nameSection.style.display = 'none';
        welcomeMessage.style.display = 'block';
        welcomeMessage.innerHTML = `<p>Hey <strong>${userName}</strong>, welcome to tipsy tiger! 🐅</p><p>A fun tracker to help you track your personal health goals. You can use it to track alcohol, coffee, or even your fizzy drinks intake - whatever makes sense for you. enjoy <3</p>`;
    }
}

// Get deployment info
function updateDeploymentInfo() {
    const deploymentInfo = document.getElementById('deploymentInfo');
    if (deploymentInfo) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        deploymentInfo.textContent = `Last updated: ${dateStr} at ${timeStr}`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    updateDeploymentInfo();
    // Name input handler
    document.getElementById('saveName').addEventListener('click', () => {
        const nameInput = document.getElementById('nameInput');
        const name = nameInput.value.trim();
        
        if (name) {
            userName = name;
            localStorage.setItem('tipsyTigerName', name);
            showWelcomeMessage();
        } else {
            alert('Please enter your name!');
        }
    });
    
    // Allow Enter key to submit name
    document.getElementById('nameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('saveName').click();
        }
    });
    
    // Show welcome if name already exists (non-auth mode)
    if (userName && !currentUser) {
        showWelcomeMessage();
    }
    
    // View filter buttons
    document.getElementById('viewMonth').addEventListener('click', () => {
        currentView = 'month';
        updateViewButtons();
        renderCalendar();
    });
    
    document.getElementById('viewYear').addEventListener('click', () => {
        currentView = 'year';
        updateViewButtons();
        renderCalendar();
    });
    
    document.getElementById('viewRange').addEventListener('click', () => {
        currentView = 'range';
        updateViewButtons();
        renderCalendar();
    });
    
    document.getElementById('viewAnalytics').addEventListener('click', () => {
        currentView = 'analytics';
        updateViewButtons();
        renderCalendar();
    });
    
    // Date range apply button
    document.getElementById('applyRange').addEventListener('click', () => {
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        
        if (startInput.value && endInput.value) {
            rangeStart = new Date(startInput.value);
            rangeEnd = new Date(endInput.value);
            
            if (rangeStart > rangeEnd) {
                alert('Start date must be before end date!');
                return;
            }
            
            renderCalendar();
        } else {
            alert('Please select both start and end dates!');
        }
    });
    
    // Set default dates for range picker
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('startDate').value = startOfMonth.toISOString().split('T')[0];
    document.getElementById('endDate').value = endOfMonth.toISOString().split('T')[0];
    
    // Event listeners
    document.getElementById('prevMonth').addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === 'year') {
            currentDate.setFullYear(currentDate.getFullYear() - 1);
        }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === 'year') {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
        }
        renderCalendar();
    });

    // Sober modal buttons
    document.getElementById('soberYes').addEventListener('click', async () => {
        const data = { sober: true };
        await saveEntry(selectedDateKey, data);
        updateDayElement(selectedDayElement, selectedDateKey);
        closeModal('soberModal');
    });

    document.getElementById('soberNo').addEventListener('click', () => {
        closeModal('soberModal');
        openDrinksModal();
    });

    // Drinks modal
    function openDrinksModal() {
        const modal = document.getElementById('drinksModal');
        const input = document.getElementById('drinksInput');
        const occasionInput = document.getElementById('occasionInput');
        input.value = '';
        occasionInput.value = '';
        input.focus();
        modal.classList.add('show');
    }

    document.getElementById('saveDrinks').addEventListener('click', async () => {
        const input = document.getElementById('drinksInput');
        const occasionInput = document.getElementById('occasionInput');
        const drinks = parseInt(input.value);
        const occasion = occasionInput.value.trim();
        
        if (drinks && drinks > 0) {
            const data = { sober: false, drinks: drinks };
            if (occasion) {
                data.occasion = occasion;
            }
            await saveEntry(selectedDateKey, data);
            updateDayElement(selectedDayElement, selectedDateKey);
            closeModal('drinksModal');
        } else {
            alert('Please enter a valid number!');
        }
    });

    document.getElementById('cancelDrinks').addEventListener('click', () => {
        closeModal('drinksModal');
    });

    // Close modals when clicking outside
    document.getElementById('soberModal').addEventListener('click', (e) => {
        if (e.target.id === 'soberModal') {
            closeModal('soberModal');
        }
    });

    document.getElementById('drinksModal').addEventListener('click', (e) => {
        if (e.target.id === 'drinksModal') {
            closeModal('drinksModal');
        }
    });

    // Allow Enter key to submit drinks input
    document.getElementById('drinksInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('saveDrinks').click();
        }
    });
    
    // Allow Enter key to submit from occasion input too
    document.getElementById('occasionInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('saveDrinks').click();
        }
    });

    // Initial render
    updateViewButtons();
    renderCalendar();
});

// Update day element after data change
function updateDayElement(dayElement, dateKey) {
    // Remove all state classes
    dayElement.classList.remove('sober', 'drinks-1', 'drinks-2', 'drinks-3', 'drinks-4', 'drinks-5', 'drinks-5plus');
    
    // Remove existing indicator
    const existingIndicator = dayElement.querySelector('.day-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add new class and indicator
    const dayClass = getDayClass(dateKey);
    if (dayClass) {
        dayElement.classList.add(dayClass);
    }
    
    const data = trackingData[dateKey];
    if (data) {
        const indicator = document.createElement('div');
        indicator.className = 'day-indicator';
        if (data.sober) {
            indicator.textContent = '✨';
        } else {
            indicator.textContent = '🍷';
        }
        dayElement.appendChild(indicator);
    }
}

// Make openDrinksModal available globally
window.openDrinksModal = function() {
    const modal = document.getElementById('drinksModal');
    const input = document.getElementById('drinksInput');
    const occasionInput = document.getElementById('occasionInput');
    input.value = '';
    occasionInput.value = '';
    input.focus();
    modal.classList.add('show');
};
