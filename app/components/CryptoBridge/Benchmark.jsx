import React from "react";

class Benchmark extends React.Component {
    static defaultProps = {};
    render() {
        return (
            <div className="grid-block vertical">
                <div className="grid-container">
                    <div className="grid-content" style={{paddingTop: "2rem"}}>
                        <img
                            src={`${__BASE_URL__}img/benchmark.png`}
                            style={{float: "left"}}
                        />

                        <p>
                            CryptoBridge and DARC are pleased to announce
                            another step forward in their respective
                            development. Through a joint effort, we will begin
                            to bring greater attention to the need for higher
                            quality projects in the crowded digital asset space.
                            Toward this end, DARC has recently begun offering
                            project evaluations and CryptoBridge seeks to use
                            its visibility and position gained in the previous
                            year to support that service and forward-leaning
                            perspective.
                        </p>

                        <p>
                            Our purpose is to recognize projects which meet or
                            exceed a baseline of fundamental quality. Through
                            our shared belief in the importance of rigorous and
                            objective assessment, we will work to foster an
                            environment which supports the digital asset
                            landscape’s maturity. Such an endeavor will benefit
                            project communities, currency and token users,
                            investors and associated enterprises.
                        </p>

                        <p>
                            A fee-based but unbiased evaluation will initially
                            be conducted by DARC to determine projects which
                            sufficiently demonstrate that they are worthy of
                            “benchmark” status and supplemental information
                            related will then become available on the
                            evaluator’s website. A smaller subset of common
                            criteria will be confirmed by CryptoBridge shortly
                            after publication of the results to validate the
                            results. Once the agreement is finalized, the
                            project’s status will recognized by each member of
                            the partnership on their websites and associated
                            social media outlets.
                        </p>

                        <p>
                            Upon benchmarking, projects will enjoy a range of
                            benefits: higher visibility on the exchange, a
                            summary of their achievement (publicized on social
                            media and blogs), increased consumer confidence,
                            etc. These projects will be required to maintain or
                            improve upon these criteria in follow-up evaluations
                            conducted periodically. This process is designed to
                            ensure objectivity and transparency and all results
                            will be communicated as such.
                        </p>

                        <p>
                            We believe strongly that for the emergent
                            cryptocurrency and blockchain economies to be taken
                            as a serious and legitimate enterprise, all
                            participants must take action now to help guide it
                            in a positive direction. With our partnership we
                            wish to model perspectives, behaviors and methods
                            consistent with an increasing level of
                            sophistication and maturity. These improvements are
                            intended to be systemic in nature. We’re excited to
                            see what positive developments this endeavor will
                            kick-start, and we hope you’ll share our enthusiasm
                            in doing so.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

export default Benchmark;
