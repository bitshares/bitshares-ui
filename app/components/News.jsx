import React from "react";
import counterpart from 'counterpart';
import steem from 'steem'
import Translate from "react-translate-component";

import LoadingIndicator from "./LoadingIndicator";

const query = {tag: 'bitshares.fdn',limit: 20};

// const wrapper = {padding: "1rem 3rem"};
const pageTitle = {padding: "0px 0px 12px 17px"};

const alignRight = {textAlign: "right"};
const alignLeft = {textAlign: "left"};
const headerStyle = {backgroundColor: "#1a2430"};
const rowHeight = {height: "2rem"};
const bodyRow = {backgroundColor: "#26384c"};
const bodyCell = {
    border: "3px solid #2e343c",
    padding: "0.5rem 1rem",
    lineHeight: "2rem",
};

const headerText = {color: "#ffffff", fontWeight: "bold"}
const leftCell = { ...alignLeft, ...bodyCell }
const rightCell = { ...alignRight, ...bodyCell }

const secondCol = { ...leftCell, width: "180px"}

const SomethingWentWrong = () => (
    <p><Translate content="news.errors.fetch" /></p>
);

const NewsTable = ({ data, width }) => {
    return (
        <table className="table table-hover dashboard-table" style={{fontSize: "0.85rem"}}>
            <thead style={headerStyle}>
                <tr>
                    <th style={rightCell}><span style={headerText}>
                        <Translate content="account.votes.line" />
                    </span></th>
                    <th style={leftCell}><span style={headerText}>
                        <Translate content="explorer.block.date" />
                    </span></th>
                    <th style={leftCell}><span style={headerText}>
                        <Translate content="news.subject" />
                    </span></th>
                    <th style={leftCell}><span style={headerText}>
                        <Translate content="news.author" />
                    </span></th>
                </tr>
            </thead>
            <tbody>
                {data.map((singleNews, iter) => {
                    console.log(singleNews.title)
                    console.log(singleNews.title.length, width)
                    const theAuthor = singleNews.parentAuthor ? singleNews.parentAuthor : singleNews.author
                    const formattedDate = counterpart.localize(new Date(singleNews.active));
                    const smartTitle = (singleNews.title.length * 6) > (width-450)
                        ? `${singleNews.title.slice(0, Math.floor(width-450)/6)}...`
                        : singleNews.title
                    return(
                        <tr
                            style={bodyRow}
                            key={`${singleNews.title.slice(0,10)}${iter}`}
                        >
                            <td style={rightCell}>
                                <a 
                                    href={`https://steemit.com${singleNews.url}`}
                                    rel="noreferrer noopener"
                                    target="_blank"
                                    style={{display: "block", color: "#ffffff"}}
                                >{iter+1}</a>
                            </td>
                            <td style={secondCol}>
                                <a
                                    href={`https://steemit.com${singleNews.url}`}
                                    rel="noreferrer noopener"
                                    target="_blank"
                                    style={{display: "block", color: "#ffffff"}}
                                >{formattedDate}</a>
                            </td>
                            <td style={leftCell}>
                                <a
                                    href={`https://steemit.com${singleNews.url}`}
                                    rel="noreferrer noopener"
                                    target="_blank"
                                    style={{display: "block", color: "#ffffff"}}
                                >{smartTitle}</a>
                            </td>
                            <td style={leftCell}>
                                <a
                                    href={`https://steemit.com${singleNews.url}`}
                                    rel="noreferrer noopener"
                                    target="_blank"
                                    style={{display: "block", color: "#ffffff"}}
                                >{theAuthor}</a>
                            </td>
                        </tr>

                    )
                })}
            </tbody>
            <thead style={headerStyle}>
                <tr style={rowHeight}>
                    <th style={rightCell} />
                    <th style={leftCell} />
                    <th style={leftCell} />
                    <th style={leftCell} />
                </tr>
            </thead>
        </table>
    );
};

class News extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: true,
            isWrong: false,
            discussions: [],
            width: 1200
        }
        this.updateDimensions = this.updateDimensions.bind(this)
    }

    updateDimensions() {
        this.setState({ width: window.innerWidth });
    }

    componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
        steem.api.getDiscussionsByBlog(query, (err, discussions) => {
            if (err) this.setState({isLoading: false, isWrong: true})
            this.setState({discussions, isLoading: false})
        });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }

    render() {
        const { isLoading, isWrong, discussions, width } = this.state

        return (
            <div className="grid-block page-layout">
                <div className="grid-block vertical">
                    <div className="account-tabs">
                        <div className="tab-content">
                            <div className="hide-selector">
                                <div className="inline-block">
                                    <Translate content="news.news" />
                                </div>
                            </div>
                            <div className="grid-block vertical">
                                {isWrong && <SomethingWentWrong />}
                                {isLoading ? <LoadingIndicator /> : null}
                                {!isWrong && !isLoading && <NewsTable width={width} data={discussions}/>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default News;
