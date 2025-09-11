import React, { useState, useMemo } from 'react';
import { ChevronUpIcon } from '../icons/Icons';

const Calendar = ({ schedules, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const isSameDay = (d1, d2) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const startOfDay = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    const schedulesByDate = useMemo(() => {
        const map = new Map();
        schedules.forEach(schedule => {
            let current = startOfDay(new Date(schedule.startDate));
            const end = startOfDay(new Date(schedule.endDate));
            
            while (current <= end) {
                const dateString = current.toISOString().split('T')[0];
                if (!map.has(dateString)) {
                    map.set(dateString, []);
                }
                map.get(dateString).push(schedule);
                current.setDate(current.getDate() + 1);
            }
        });
        return map;
    }, [schedules]);

    const changeMonth = (amount) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const handleDateClick = (day) => {
        if (selectedDate && isSameDay(day, selectedDate)) {
            setSelectedDate(null);
            onDateSelect(null);
        } else {
            setSelectedDate(day);
            onDateSelect(day);
        }
    };
    
    const renderHeader = () => {
        const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' });
        return (
            <div className="flex items-center justify-between py-2 px-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100">
                    <ChevronUpIcon className="w-5 h-5 transform -rotate-90" />
                </button>
                <h2 className="text-lg font-semibold text-slate-900">{dateFormat.format(currentDate)}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100">
                    <ChevronUpIcon className="w-5 h-5 transform rotate-90" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
                {days.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - monthStart.getDay());
        const endDate = new Date(monthEnd);
        endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

        const rows = [];
        let day = startDate;

        while (day <= endDate) {
            let week = [];
            for (let i = 0; i < 7; i++) {
                const cloneDay = new Date(day);
                const isCurrentMonth = cloneDay.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(cloneDay, new Date());
                const isSelected = selectedDate && isSameDay(cloneDay, selectedDate);
                const dateString = cloneDay.toISOString().split('T')[0];
                const hasSchedule = schedulesByDate.has(dateString);

                week.push(
                    <div key={day.toString()} className="text-center py-1 flex justify-center">
                        <button
                            onClick={() => handleDateClick(cloneDay)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors relative ${
                                !isCurrentMonth ? 'text-slate-400' : 'text-slate-700'
                            } ${
                                isSelected ? 'bg-pygenic-blue text-white font-bold' : 
                                isToday ? 'bg-pygenic-blue/20' : 
                                'hover:bg-slate-100'
                            }`}
                        >
                            <span>{cloneDay.getDate()}</span>
                            {hasSchedule && !isSelected && <div className="absolute bottom-1 w-1.5 h-1.5 bg-pygenic-blue rounded-full"></div>}
                        </button>
                    </div>
                );
                day.setDate(day.getDate() + 1);
            }
            rows.push(<div key={day.toString()} className="grid grid-cols-7">{week}</div>);
        }
        return <div>{rows}</div>;
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
};

export default Calendar;