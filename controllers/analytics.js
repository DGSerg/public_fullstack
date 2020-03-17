const moment = require('moment');
const Order = require('../models/Order');
const errorHandler = require('../utils/errorHandler');

module.exports.overview = async function (req, res) {
    try {
        const allOrders = await Order.find({user: req.user.id}).sort({date: 1});
        const ordersMap = getOrdersMap(allOrders);
        const yesterdayOrders = ordersMap[moment().add(-1, 'd').format('DD.MM.YYYY')] || [];

        const yesterdayOrdersNumber = yesterdayOrders.length;
        //Количество заказов
        const totalOrdersNumber = allOrders.length;
        // Количиство дней всего
        const daysNumber = Object.keys(ordersMap).length;
        // заказов в день
        const ordersPerDay =(totalOrdersNumber / daysNumber).toFixed(0);
        // процент количества заказов
        const ordersPercent = (((yesterdayOrdersNumber / ordersPerDay)-1)*100).toFixed(2);

        const totalGain = calculatePrice(allOrders);

        const gainPerDay = totalGain / daysNumber;

        const yesterdayGain = calculatePrice(yesterdayOrders);

        const gainPercent = (((yesterdayGain / gainPerDay)-1)*100).toFixed(2);

        const compareGain = (yesterdayGain - gainPerDay).toFixed(2);

        const compareNumber = (yesterdayOrdersNumber - ordersPerDay).toFixed(2);

        res.status(200).json({
            gain: {
                percent: Math.abs(+gainPercent),
                compare: Math.abs(+compareGain),
                yesterday: +yesterdayGain,
                isHigher: gainPercent > 0
            },
            orders: {
                percent: Math.abs(+ordersPercent),
                compare: Math.abs(+compareNumber),
                yesterday: +yesterdayOrdersNumber,
                isHigher: ordersPercent > 0
            }
        })
    }catch (e) {
        errorHandler(res,e);
    }

};
module.exports.analytics = async function (req, res) {

    try {
        const allOrders = await Order.find({user: req.user.id}).sort({date: 1});
        const ordersMap = getOrdersMap(allOrders);

        const average = +(calculatePrice(allOrders) / Object.keys(ordersMap).length).toFixed(2);

        const chart = Object.keys(ordersMap).map(label => {
            const gain = calculatePrice(ordersMap[label]);
            const order = ordersMap[label].length;

            return { label, gain, order}
        });

        res.status(200).json({
            average,
            chart
        })

    }catch (e) {
        errorHandler(res, e);
    }

};

function getOrdersMap(orders = []) {
    const daysOrder = {};
    orders.forEach(order => {
        const date = moment(order.date).format('DD.MM.YYYY');

        if (date === moment().format('DD.MM.YYYY')){
            return
        }

        if (!daysOrder[date]){
            daysOrder[date] = []
        }

        daysOrder[date].push(order);
    });

    return daysOrder;
}

function calculatePrice(orders = []) {
    return orders.reduce((total, order) => {
        const orderPrice = order.list.reduce((orderTotal, item) => {
            return orderTotal += item.cost * item.quantity;
        }, 0);
        return total += orderPrice;
    }, 0);
}