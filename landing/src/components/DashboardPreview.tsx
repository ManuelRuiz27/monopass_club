import { BarChart3, Users, CreditCard, ArrowUpRight } from 'lucide-react';

export const DashboardPreview = () => {
    return (
        <section className="section-dark" style={{ paddingBottom: '0' }}>
            <div className="container">
                <div className="dashboard-preview">
                    <div className="dashboard-preview__header text-center mb-12">
                        <h2 className="section-title">Tu Negocio en Tiempo Real</h2>
                        <p className="section-subtitle">Lo que no se mide, se pierde. Ten el pulso exacto de tu operación.</p>
                    </div>

                    <div className="dashboard-mockup">
                        <div className="dashboard-mockup__frame">
                            {/* Mock Header */}
                            <div className="mock-header">
                                <div className="mock-logo">MONOPASS ADMIN</div>
                                <div className="mock-user">Admin Club</div>
                            </div>

                            {/* Mock Grid */}
                            <div className="mock-grid">
                                {/* Stats Cards */}
                                <div className="mock-card">
                                    <div className="mock-card__title">
                                        <Users size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                        Aforo Actual
                                    </div>
                                    <div className="mock-card__value">
                                        842
                                        <span className="up">
                                            <ArrowUpRight size={14} style={{ display: 'inline' }} /> 12%
                                        </span>
                                    </div>
                                </div>
                                <div className="mock-card">
                                    <div className="mock-card__title">
                                        <CreditCard size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                        Ingresos Puerta
                                    </div>
                                    <div className="mock-card__value">
                                        $126,500
                                        <span className="up">+4.2%</span>
                                    </div>
                                </div>
                                <div className="mock-card">
                                    <div className="mock-card__title">
                                        <BarChart3 size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                        Cortesías
                                    </div>
                                    <div className="mock-card__value">45 / 50 <span className="warn">90% uso</span></div>
                                </div>

                                {/* Main Integ */}
                                <div className="mock-card mock-card--wide">
                                    <div className="mock-card__title">Afluencia por Hora</div>
                                    <div className="mock-chart">
                                        <div className="bar" style={{ height: '30%' }}></div>
                                        <div className="bar" style={{ height: '45%' }}></div>
                                        <div className="bar" style={{ height: '80%' }}></div>
                                        <div className="bar" style={{ height: '65%' }}></div>
                                        <div className="bar" style={{ height: '90%' }}></div>
                                        <div className="bar" style={{ height: '50%' }}></div>
                                        <div className="bar" style={{ height: '30%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-mockup__glow"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};
